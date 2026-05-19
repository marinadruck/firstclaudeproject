import type { Signal } from '@/types';

// ─── DATA CONTRACT ────────────────────────────────────────────────────────────
//
// TrainingRecord is the core unit of the future ML pipeline.
// One record is created per ticker per day. It starts with features known
// at prediction time, then gets filled in once the next trading day closes.
//
// All future training, backtesting, and retraining code must use this type.

export interface TrainingRecord {
  // Identity
  ticker: string;   // e.g. "AAPL"
  date:   string;   // "YYYY-MM-DD" — the day this snapshot was taken

  // Input features (available on the day of prediction, before market open)
  newsMentionCount:      number;        // news article mentions in the last 24 h
  redditMentionCount:    number;        // Reddit post mentions in the last 24 h (0 before Phase 5)
  newsSentimentScore:    number;        // -1.0 to +1.0 from news keyword scorer
  redditSentimentScore:  number | null; // -1.0 to +1.0 from Reddit keyword scorer (null before Phase 5)
  combinedSentimentScore: number;       // weighted blend: 70% news + 30% Reddit
  priceChangePct: number;               // that day's price return, e.g. +1.3 means +1.3%
  volume:         number | null;        // trading volume — null until real data is connected

  // Label (only known after the *next* trading day closes)
  nextDayReturnPct: number | null; // actual next-day % return — null until market closes

  // Prediction tracking (filled in once the model is active and making predictions)
  predictionMade:  'Bullish' | 'Neutral' | 'Bearish' | null; // what the model predicted
  actualOutcome:   'Bullish' | 'Neutral' | 'Bearish' | null; // derived from nextDayReturnPct
  predictionError: number | null; // |predicted_probability - actual_binary_outcome|, 0 = perfect
}

// Derive outcome label from a return percentage.
// Thresholds can be tuned; ±0.5% is a reasonable starting point.
export function deriveOutcome(
  returnPct: number,
): 'Bullish' | 'Neutral' | 'Bearish' {
  if (returnPct >  0.5) return 'Bullish';
  if (returnPct < -0.5) return 'Bearish';
  return 'Neutral';
}

// ─── MOCK HISTORY ─────────────────────────────────────────────────────────────
//
// 20 records for AAPL illustrating the schema.
// In production, this data would live in a database, not a flat file.

export const MOCK_TRAINING_HISTORY: TrainingRecord[] = [
  { ticker: 'AAPL', date: '2026-04-20', newsMentionCount:  97, redditMentionCount: 33, newsSentimentScore:  0.61, redditSentimentScore: null, combinedSentimentScore:  0.61, priceChangePct:  0.8, volume: null, nextDayReturnPct:  1.2, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.08 },
  { ticker: 'AAPL', date: '2026-04-21', newsMentionCount:  93, redditMentionCount: 32, newsSentimentScore:  0.58, redditSentimentScore: null, combinedSentimentScore:  0.58, priceChangePct:  0.4, volume: null, nextDayReturnPct: -0.3, predictionMade: 'Bullish', actualOutcome: 'Neutral',  predictionError: 0.31 },
  { ticker: 'AAPL', date: '2026-04-22', newsMentionCount:  86, redditMentionCount: 32, newsSentimentScore:  0.42, redditSentimentScore: null, combinedSentimentScore:  0.42, priceChangePct: -0.9, volume: null, nextDayReturnPct:  0.6, predictionMade: 'Neutral', actualOutcome: 'Bullish',  predictionError: 0.22 },
  { ticker: 'AAPL', date: '2026-04-23', newsMentionCount:  99, redditMentionCount: 41, newsSentimentScore:  0.65, redditSentimentScore: null, combinedSentimentScore:  0.65, priceChangePct:  1.3, volume: null, nextDayReturnPct:  0.7, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.06 },
  { ticker: 'AAPL', date: '2026-04-24', newsMentionCount: 108, redditMentionCount: 44, newsSentimentScore:  0.70, redditSentimentScore: null, combinedSentimentScore:  0.70, priceChangePct:  0.7, volume: null, nextDayReturnPct:  1.5, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.04 },
  { ticker: 'AAPL', date: '2026-04-25', newsMentionCount:  78, redditMentionCount: 32, newsSentimentScore:  0.38, redditSentimentScore: null, combinedSentimentScore:  0.38, priceChangePct: -0.7, volume: null, nextDayReturnPct: -0.8, predictionMade: 'Neutral', actualOutcome: 'Bearish',  predictionError: 0.29 },
  { ticker: 'AAPL', date: '2026-04-28', newsMentionCount:  94, redditMentionCount: 39, newsSentimentScore:  0.55, redditSentimentScore: null, combinedSentimentScore:  0.55, priceChangePct:  0.5, volume: null, nextDayReturnPct:  0.3, predictionMade: 'Bullish', actualOutcome: 'Neutral',  predictionError: 0.27 },
  { ticker: 'AAPL', date: '2026-04-29', newsMentionCount:  98, redditMentionCount: 40, newsSentimentScore:  0.62, redditSentimentScore: null, combinedSentimentScore:  0.62, priceChangePct:  0.9, volume: null, nextDayReturnPct:  1.1, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.07 },
  { ticker: 'AAPL', date: '2026-04-30', newsMentionCount:  87, redditMentionCount: 33, newsSentimentScore:  0.48, redditSentimentScore: null, combinedSentimentScore:  0.48, priceChangePct: -0.4, volume: null, nextDayReturnPct: -0.2, predictionMade: 'Neutral', actualOutcome: 'Neutral',  predictionError: 0.05 },
  { ticker: 'AAPL', date: '2026-05-01', newsMentionCount: 112, redditMentionCount: 46, newsSentimentScore:  0.71, redditSentimentScore: null, combinedSentimentScore:  0.71, priceChangePct:  1.0, volume: null, nextDayReturnPct:  1.8, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.03 },
  { ticker: 'AAPL', date: '2026-05-02', newsMentionCount: 103, redditMentionCount: 42, newsSentimentScore:  0.64, redditSentimentScore: null, combinedSentimentScore:  0.64, priceChangePct:  0.6, volume: null, nextDayReturnPct:  0.4, predictionMade: 'Bullish', actualOutcome: 'Neutral',  predictionError: 0.24 },
  { ticker: 'AAPL', date: '2026-05-05', newsMentionCount:  91, redditMentionCount: 38, newsSentimentScore:  0.53, redditSentimentScore: null, combinedSentimentScore:  0.53, priceChangePct:  0.2, volume: null, nextDayReturnPct:  0.9, predictionMade: 'Neutral', actualOutcome: 'Bullish',  predictionError: 0.30 },
  { ticker: 'AAPL', date: '2026-05-06', newsMentionCount: 104, redditMentionCount: 43, newsSentimentScore:  0.67, redditSentimentScore: null, combinedSentimentScore:  0.67, priceChangePct:  0.8, volume: null, nextDayReturnPct:  1.3, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.05 },
  { ticker: 'AAPL', date: '2026-05-07', newsMentionCount:  96, redditMentionCount: 40, newsSentimentScore:  0.60, redditSentimentScore: null, combinedSentimentScore:  0.60, priceChangePct:  0.5, volume: null, nextDayReturnPct: -0.1, predictionMade: 'Bullish', actualOutcome: 'Neutral',  predictionError: 0.28 },
  { ticker: 'AAPL', date: '2026-05-08', newsMentionCount:  82, redditMentionCount: 33, newsSentimentScore:  0.44, redditSentimentScore: null, combinedSentimentScore:  0.44, priceChangePct: -0.6, volume: null, nextDayReturnPct: -1.0, predictionMade: 'Neutral', actualOutcome: 'Bearish',  predictionError: 0.32 },
  { ticker: 'AAPL', date: '2026-05-09', newsMentionCount:  76, redditMentionCount: 32, newsSentimentScore:  0.35, redditSentimentScore: null, combinedSentimentScore:  0.35, priceChangePct: -1.1, volume: null, nextDayReturnPct: -0.6, predictionMade: 'Neutral', actualOutcome: 'Bearish',  predictionError: 0.25 },
  { ticker: 'AAPL', date: '2026-05-12', newsMentionCount:  95, redditMentionCount: 39, newsSentimentScore:  0.59, redditSentimentScore: null, combinedSentimentScore:  0.59, priceChangePct:  0.7, volume: null, nextDayReturnPct:  0.8, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.09 },
  { ticker: 'AAPL', date: '2026-05-13', newsMentionCount: 101, redditMentionCount: 42, newsSentimentScore:  0.66, redditSentimentScore: null, combinedSentimentScore:  0.66, priceChangePct:  0.4, volume: null, nextDayReturnPct:  1.0, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.06 },
  { ticker: 'AAPL', date: '2026-05-14', newsMentionCount: 106, redditMentionCount: 43, newsSentimentScore:  0.69, redditSentimentScore: null, combinedSentimentScore:  0.69, priceChangePct:  0.6, volume: null, nextDayReturnPct:  null, predictionMade: 'Bullish', actualOutcome: null,       predictionError: null },
  { ticker: 'AAPL', date: '2026-05-15', newsMentionCount: 100, redditMentionCount: 42, newsSentimentScore:  0.67, redditSentimentScore: null, combinedSentimentScore:  0.67, priceChangePct:  0.3, volume: null, nextDayReturnPct:  null, predictionMade: null,      actualOutcome: null,       predictionError: null },
];

/*
 * ─── SELF-IMPROVING PIPELINE (future — not implemented) ──────────────────────
 *
 * GOAL: A model that gets better over time by learning from its own past mistakes.
 *
 * ── DAILY LOOP (once real data is connected) ──────────────────────────────────
 *
 * 1. PREDICT (before market open each day)
 *    - Fetch today's newsSentimentScore, redditSentimentScore, combinedSentimentScore,
 *      newsMentionCount, redditMentionCount, priceChangePct
 *    - Run model → output Bullish / Neutral / Bearish + confidence score
 *    - Save a new TrainingRecord with predictionMade set, nextDayReturnPct = null
 *
 * 2. RECORD OUTCOME (after market close the following day)
 *    - Fill in nextDayReturnPct from real price data
 *    - Compute actualOutcome using deriveOutcome()
 *    - Compute predictionError = |predicted_probability - actual_binary_outcome|
 *    - Mark the record complete and save to the database
 *
 * 3. RETRAIN (weekly, or when rolling average predictionError rises above threshold)
 *    - Load all completed TrainingRecords from the database
 *    - Retrain model on the full available history
 *    - Backtest on the held-out last 30 days BEFORE deploying the new version
 *    - Only replace the live model if the new version improves accuracy
 *
 * ── MODEL APPROACH ────────────────────────────────────────────────────────────
 *
 * Start simple:
 *   - Logistic regression: P(nextDayReturn > 0) given [sentiment, mentions, momentum]
 *   - Libraries: scikit-learn (Python microservice) or ml-matrix (JavaScript)
 *
 * Upgrade path (once > 200 records per ticker):
 *   - Gradient boosting: XGBoost or LightGBM
 *   - Add features: 3-day rolling sentiment average, volume momentum, sector correlation
 *
 * ── FUTURE FOLDER STRUCTURE ──────────────────────────────────────────────────
 *
 *   src/lib/ml-placeholder.ts     ← this file (data contract lives here forever)
 *
 *   future/ml/                    ← JavaScript model (add when ready)
 *     trainer.ts                    load history, fit model, save weights
 *     predictor.ts                  load weights, score a new day's features
 *     backtester.ts                 evaluate accuracy on held-out data
 *
 *   future/python-model/          ← alternative: Python served as microservice
 *     train.py
 *     predict.py
 *     requirements.txt
 *
 * ── CRITICAL RULES ────────────────────────────────────────────────────────────
 *
 *   - Never deploy a new model version without backtesting first
 *   - Always track predictionError trend — if it rises, investigate before retraining
 *   - Never present model output as financial advice
 *   - Treat any accuracy above 55% on truly unseen data as meaningful signal
 */

// Utility: compute mean prediction error across a set of completed records.
export function meanPredictionError(records: TrainingRecord[]): number | null {
  const completed = records.filter((r) => r.predictionError !== null);
  if (completed.length === 0) return null;
  const total = completed.reduce((sum, r) => sum + (r.predictionError ?? 0), 0);
  return Math.round((total / completed.length) * 1000) / 1000;
}

// Suppress unused-variable warning — Signal is re-exported for future use in ML code.
export type { Signal };
