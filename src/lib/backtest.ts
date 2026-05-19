import { computeRecommendation } from './recommendations';
import { computeSignal } from './signals';
import { deriveOutcome, type TrainingRecord } from './ml-placeholder';
import type { BacktestTrade, BacktestMetrics } from '@/types';

function computeForwardReturn(
  records: TrainingRecord[],
  startIdx: number,
  holdingDays: number,
): number | null {
  let compounded = 1;
  for (let d = 0; d < holdingDays; d++) {
    const rec = records[startIdx + d];
    if (!rec || rec.nextDayReturnPct === null) return null;
    compounded *= 1 + rec.nextDayReturnPct / 100;
  }
  return +(( compounded - 1) * 100).toFixed(3);
}

export function runBacktest(
  records: TrainingRecord[],
  holdingDays: number,
): BacktestTrade[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const trades: BacktestTrade[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const rec = sorted[i];
    const forwardReturnPct = computeForwardReturn(sorted, i, holdingDays);
    if (forwardReturnPct === null) continue;

    const mentionCount = rec.newsMentionCount + rec.redditMentionCount;
    const signal = computeSignal(mentionCount, rec.combinedSentimentScore);

    const { priceOutlook, recommendation } = computeRecommendation({
      sentimentScore:     rec.combinedSentimentScore,
      mentionCount,
      newsMentionCount:   rec.newsMentionCount,
      redditMentionCount: rec.redditMentionCount,
      signal,
      priceChangePercent: rec.priceChangePct,
    });

    const actualOutcome = deriveOutcome(forwardReturnPct);
    const isWin =
      priceOutlook.direction !== 'Neutral' &&
      priceOutlook.direction === actualOutcome;

    trades.push({
      date:             rec.date,
      direction:        priceOutlook.direction,
      confidence:       priceOutlook.confidence,
      action:           recommendation.action,
      forwardReturnPct,
      actualOutcome,
      isWin,
    });
  }

  return trades;
}

export function computeMetrics(trades: BacktestTrade[]): BacktestMetrics {
  if (trades.length === 0) {
    return {
      totalSignals: 0, directionalSignals: 0, wins: 0, winRate: 0,
      avgReturn: 0, avgBullishReturn: 0, avgBearishReturn: 0,
      bestTrade: 0, worstTrade: 0, maxDrawdown: 0,
    };
  }

  const directional = trades.filter(t => t.direction !== 'Neutral');
  const wins        = directional.filter(t => t.isWin).length;
  const returns     = trades.map(t => t.forwardReturnPct);

  const mean = (arr: number[]) =>
    arr.length === 0 ? 0 : +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(3);

  const bullishReturns = trades.filter(t => t.direction === 'Bullish').map(t => t.forwardReturnPct);
  const bearishReturns = trades.filter(t => t.direction === 'Bearish').map(t => t.forwardReturnPct);

  // Max drawdown on compound equity curve
  let equity   = 1;
  let peak     = 1;
  let maxDD    = 0;
  for (const r of returns) {
    equity *= 1 + r / 100;
    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  return {
    totalSignals:      trades.length,
    directionalSignals: directional.length,
    wins,
    winRate:           directional.length > 0
                         ? +( wins / directional.length).toFixed(4)
                         : 0,
    avgReturn:         mean(returns),
    avgBullishReturn:  mean(bullishReturns),
    avgBearishReturn:  mean(bearishReturns),
    bestTrade:         +Math.max(...returns).toFixed(3),
    worstTrade:        +Math.min(...returns).toFixed(3),
    maxDrawdown:       +(maxDD * 100).toFixed(2),
  };
}
