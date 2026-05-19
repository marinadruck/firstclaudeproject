import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TRAINING_HISTORY } from '@/lib/ml-placeholder';
import { runBacktest, computeMetrics } from '@/lib/backtest';
import type { BacktestResult } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker      = params.ticker.toUpperCase();
  const { searchParams } = req.nextUrl;
  const from        = searchParams.get('from') ?? '';
  const to          = searchParams.get('to') ?? '';
  const holdingDays = Math.min(10, Math.max(1, parseInt(searchParams.get('holdingDays') ?? '1', 10)));

  const byTicker = MOCK_TRAINING_HISTORY.filter(r => r.ticker === ticker);
  if (byTicker.length === 0) {
    return NextResponse.json(
      { error: `No historical data for ${ticker}. Currently only AAPL has mock training data.` },
      { status: 404 },
    );
  }

  const filtered = byTicker.filter(r =>
    (!from || r.date >= from) && (!to || r.date <= to),
  );
  if (filtered.length < 5) {
    return NextResponse.json(
      { error: 'Date range too narrow — fewer than 5 records found. Try a wider range.' },
      { status: 400 },
    );
  }

  const trades  = runBacktest(filtered, holdingDays);
  const metrics = computeMetrics(trades);

  const result: BacktestResult = {
    ticker,
    dataSource: 'mock',
    holdingDays,
    from: filtered[0].date,
    to:   filtered[filtered.length - 1].date,
    trades,
    metrics,
  };

  return NextResponse.json(result);
}
