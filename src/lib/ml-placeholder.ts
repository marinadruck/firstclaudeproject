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
  sentimentScore: number;       // -1.0 to +1.0 from NLP model
  mentionCount:   number;       // social + news mentions in the last 24 h
  priceChangePct: number;       // that day's price return, e.g. +1.3 means +1.3%
  volume:         number | null; // trading volume — null until real data is connected

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
  { ticker: 'AAPL', date: '2026-04-20', sentimentScore:  0.61, mentionCount: 130, priceChangePct:  0.8, volume: null, nextDayReturnPct:  1.2, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.08 },
  { ticker: 'AAPL', date: '2026-04-21', sentimentScore:  0.58, mentionCount: 125, priceChangePct:  0.4, volume: null, nextDayReturnPct: -0.3, predictionMade: 'Bullish', actualOutcome: 'Neutral',  predictionError: 0.31 },
  { ticker: 'AAPL', date: '2026-04-22', sentimentScore:  0.42, mentionCount: 118, priceChangePct: -0.9, volume: null, nextDayReturnPct:  0.6, predictionMade: 'Neutral', actualOutcome: 'Bullish',  predictionError: 0.22 },
  { ticker: 'AAPL', date: '2026-04-23', sentimentScore:  0.65, mentionCount: 140, priceChangePct:  1.3, volume: null, nextDayReturnPct:  0.7, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.06 },
  { ticker: 'AAPL', date: '2026-04-24', sentimentScore:  0.70, mentionCount: 152, priceChangePct:  0.7, volume: null, nextDayReturnPct:  1.5, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.04 },
  { ticker: 'AAPL', date: '2026-04-25', sentimentScore:  0.38, mentionCount: 110, priceChangePct: -0.7, volume: null, nextDayReturnPct: -0.8, predictionMade: 'Neutral', actualOutcome: 'Bearish',  predictionError: 0.29 },
  { ticker: 'AAPL', date: '2026-04-28', sentimentScore:  0.55, mentionCount: 133, priceChangePct:  0.5, volume: null, nextDayReturnPct:  0.3, predictionMade: 'Bullish', actualOutcome: 'Neutral',  predictionError: 0.27 },
  { ticker: 'AAPL', date: '2026-04-29', sentimentScore:  0.62, mentionCount: 138, priceChangePct:  0.9, volume: null, nextDayReturnPct:  1.1, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.07 },
  { ticker: 'AAPL', date: '2026-04-30', sentimentScore:  0.48, mentionCount: 120, priceChangePct: -0.4, volume: null, nextDayReturnPct: -0.2, predictionMade: 'Neutral', actualOutcome: 'Neutral',  predictionError: 0.05 },
  { ticker: 'AAPL', date: '2026-05-01', sentimentScore:  0.71, mentionCount: 158, priceChangePct:  1.0, volume: null, nextDayReturnPct:  1.8, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.03 },
  { ticker: 'AAPL', date: '2026-05-02', sentimentScore:  0.64, mentionCount: 145, priceChangePct:  0.6, volume: null, nextDayReturnPct:  0.4, predictionMade: 'Bullish', actualOutcome: 'Neutral',  predictionError: 0.24 },
  { ticker: 'AAPL', date: '2026-05-05', sentimentScore:  0.53, mentionCount: 129, priceChangePct:  0.2, volume: null, nextDayReturnPct:  0.9, predictionMade: 'Neutral', actualOutcome: 'Bullish',  predictionError: 0.30 },
  { ticker: 'AAPL', date: '2026-05-06', sentimentScore:  0.67, mentionCount: 147, priceChangePct:  0.8, volume: null, nextDayReturnPct:  1.3, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.05 },
  { ticker: 'AAPL', date: '2026-05-07', sentimentScore:  0.60, mentionCount: 136, priceChangePct:  0.5, volume: null, nextDayReturnPct: -0.1, predictionMade: 'Bullish', actualOutcome: 'Neutral',  predictionError: 0.28 },
  { ticker: 'AAPL', date: '2026-05-08', sentimentScore:  0.44, mentionCount: 115, priceChangePct: -0.6, volume: null, nextDayReturnPct: -1.0, predictionMade: 'Neutral', actualOutcome: 'Bearish',  predictionError: 0.32 },
  { ticker: 'AAPL', date: '2026-05-09', sentimentScore:  0.35, mentionCount: 108, priceChangePct: -1.1, volume: null, nextDayReturnPct: -0.6, predictionMade: 'Neutral', actualOutcome: 'Bearish',  predictionError: 0.25 },
  { ticker: 'AAPL', date: '2026-05-12', sentimentScore:  0.59, mentionCount: 134, priceChangePct:  0.7, volume: null, nextDayReturnPct:  0.8, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.09 },
  { ticker: 'AAPL', date: '2026-05-13', sentimentScore:  0.66, mentionCount: 143, priceChangePct:  0.4, volume: null, nextDayReturnPct:  1.0, predictionMade: 'Bullish', actualOutcome: 'Bullish',  predictionError: 0.06 },
  { ticker: 'AAPL', date: '2026-05-14', sentimentScore:  0.69, mentionCount: 149, priceChangePct:  0.6, volume: null, nextDayReturnPct:  null, predictionMade: 'Bullish', actualOutcome: null,       predictionError: null },
  { ticker: 'AAPL', date: '2026-05-15', sentimentScore:  0.67, mentionCount: 142, priceChangePct:  0.3, volume: null, nextDayReturnPct:  null, predictionMade: null,      actualOutcome: null,       predictionError: null },
];

/*
 * ─── SELF-IMPROVING PIPELINE (future — not implemented) ──────────────────────
 *
 * GOAL: A model that gets better over time by learning from its own past mistakes.
 *
 * ── DAILY LOOP (once real data is connected) ──────────────────────────────────
 *
 * 1. PREDICT (before market open each day)
 *    - Fetch today's sentimentScore, mentionCount, priceChangePct
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
