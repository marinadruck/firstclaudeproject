import { MOCK_TRAINING_HISTORY, deriveOutcome, type TrainingRecord } from './ml-placeholder';
import { computeRecommendation } from './recommendations';
import { computeSignal } from './signals';
import type { MLPrediction, OutlookDirection, ConfidenceLevel } from '@/types';

// ─── INTERNAL TYPES ───────────────────────────────────────────────────────────

interface FeatureStats { mean: number; std: number; }

interface TrainedModel {
  weights: number[];       // [bias, w_sentiment, w_price, w_news, w_reddit]
  featureStats: FeatureStats[];
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function computeStats(values: number[]): FeatureStats {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance) || 1 };
}

function normalise(v: number, s: FeatureStats): number {
  return (v - s.mean) / s.std;
}

function extractRaw(r: TrainingRecord): number[] {
  return [r.combinedSentimentScore, r.priceChangePct, r.newsMentionCount, r.redditMentionCount];
}

const FEATURE_NAMES = ['Sentiment Score', 'Price Momentum', 'News Mentions', 'Reddit Mentions'];

// ─── TRAINING ─────────────────────────────────────────────────────────────────

function trainModel(records: TrainingRecord[]): TrainedModel {
  const completed = records.filter(r => r.nextDayReturnPct !== null);

  const fallback: TrainedModel = {
    weights: [0, 0, 0, 0, 0],
    featureStats: Array(4).fill({ mean: 0, std: 1 }),
  };
  if (completed.length < 3) return fallback;

  const rawX       = completed.map(extractRaw);
  const labels     = completed.map(r => (r.nextDayReturnPct! > 0 ? 1 : 0));
  const featureStats = [0, 1, 2, 3].map(i => computeStats(rawX.map(row => row[i])));
  const X          = rawX.map(row => row.map((v, i) => normalise(v, featureStats[i])));

  const n       = completed.length;
  const weights = [0, 0, 0, 0, 0];
  const lr      = 0.1;

  for (let epoch = 0; epoch < 500; epoch++) {
    const grads = new Array(5).fill(0);
    for (let i = 0; i < n; i++) {
      const z    = weights[0] + X[i].reduce((s, x, j) => s + weights[j + 1] * x, 0);
      const err  = sigmoid(z) - labels[i];
      grads[0]  += err;
      for (let j = 0; j < 4; j++) grads[j + 1] += err * X[i][j];
    }
    for (let j = 0; j < 5; j++) weights[j] -= (lr * grads[j]) / n;
  }

  return { weights, featureStats };
}

// ─── EXPECTED RETURN (k-NN) ───────────────────────────────────────────────────

function knnExpectedReturn(
  rawTarget: number[],
  records: TrainingRecord[],
  stats: FeatureStats[],
): number {
  const completed = records.filter(r => r.nextDayReturnPct !== null);
  if (completed.length === 0) return 0;

  const normTarget = rawTarget.map((v, i) => normalise(v, stats[i]));

  const ranked = completed
    .map(r => {
      const normR = extractRaw(r).map((v, i) => normalise(v, stats[i]));
      const dist  = Math.sqrt(normR.reduce((s, v, i) => s + (v - normTarget[i]) ** 2, 0));
      return { dist, ret: r.nextDayReturnPct! };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5);

  const totalW  = ranked.reduce((s, n) => s + 1 / (n.dist + 1e-6), 0);
  const weighted = ranked.reduce((s, n) => s + n.ret * (1 / (n.dist + 1e-6)) / totalW, 0);
  return +weighted.toFixed(3);
}

// ─── MODULE-LEVEL CACHE ───────────────────────────────────────────────────────

const modelCache = new Map<string, TrainedModel>();

function getModel(ticker: string, records: TrainingRecord[]): TrainedModel {
  if (!modelCache.has(ticker)) modelCache.set(ticker, trainModel(records));
  return modelCache.get(ticker)!;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function predictML(ticker: string): MLPrediction {
  const allRecords = MOCK_TRAINING_HISTORY.filter(r => r.ticker === ticker);
  if (allRecords.length === 0) {
    throw new Error(
      `No mock training data available for ${ticker}. Currently only AAPL is supported.`,
    );
  }

  const model = getModel(ticker, allRecords);

  // Use the most recent record as the "current snapshot"
  const sorted  = [...allRecords].sort((a, b) => b.date.localeCompare(a.date));
  const current = sorted[0];
  const rawFeatures = extractRaw(current);
  const normFeatures = rawFeatures.map((v, i) => normalise(v, model.featureStats[i]));

  // Probability
  const z            = model.weights[0] + normFeatures.reduce((s, x, j) => s + model.weights[j + 1] * x, 0);
  const probabilityUp: number = +sigmoid(z).toFixed(4);

  // Direction & confidence
  let predictedDirection: OutlookDirection;
  let confidence: ConfidenceLevel;

  if (probabilityUp >= 0.6)      predictedDirection = 'Bullish';
  else if (probabilityUp <= 0.4) predictedDirection = 'Bearish';
  else                           predictedDirection = 'Neutral';

  if (probabilityUp >= 0.7 || probabilityUp <= 0.3)      confidence = 'High';
  else if (probabilityUp >= 0.6 || probabilityUp <= 0.4) confidence = 'Medium';
  else                                                    confidence = 'Low';

  // Expected return via k-NN
  const expectedReturnPct = knnExpectedReturn(rawFeatures, allRecords, model.featureStats);

  // Feature contributions sorted by magnitude
  const featureContributions = FEATURE_NAMES.map((name, i) => ({
    name,
    value: +rawFeatures[i].toFixed(3),
    contribution: +(model.weights[i + 1] * normFeatures[i]).toFixed(4),
  })).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  // Rule-based comparison using same feature snapshot
  const mentionCount = current.newsMentionCount + current.redditMentionCount;
  const signal       = computeSignal(mentionCount, current.combinedSentimentScore);
  const { priceOutlook, recommendation } = computeRecommendation({
    sentimentScore:     current.combinedSentimentScore,
    mentionCount,
    newsMentionCount:   current.newsMentionCount,
    redditMentionCount: current.redditMentionCount,
    signal,
    priceChangePercent: current.priceChangePct,
  });

  // Human-readable explanation
  const top        = featureContributions[0];
  const dirWord    = predictedDirection === 'Bullish' ? 'positive' : predictedDirection === 'Bearish' ? 'negative' : 'neutral';
  const trainingSize = allRecords.filter(r => r.nextDayReturnPct !== null).length;

  const modelExplanation =
    `The model assigns a ${(probabilityUp * 100).toFixed(1)}% probability of a positive ` +
    `next-day return. The strongest contributing factor is ${top.name} ` +
    `(${top.contribution >= 0 ? '+' : ''}${top.contribution.toFixed(3)}), ` +
    `which pushes the prediction in a ${dirWord} direction. ` +
    `Trained on ${trainingSize} completed AAPL mock records — ` +
    `this is a prototype and results carry no predictive validity.`;

  return {
    ticker,
    dataSource:           'mock',
    predictionDate:        current.date,
    features: {
      combinedSentimentScore: current.combinedSentimentScore,
      priceChangePct:         current.priceChangePct,
      newsMentionCount:       current.newsMentionCount,
      redditMentionCount:     current.redditMentionCount,
    },
    probabilityUp,
    predictedDirection,
    confidence,
    expectedReturnPct,
    featureContributions,
    modelExplanation,
    trainingSize,
    ruleBasedDirection: priceOutlook.direction,
    ruleBasedAction:    recommendation.action,
  };
}
