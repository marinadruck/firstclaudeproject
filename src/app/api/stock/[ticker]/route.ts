import { NextRequest, NextResponse } from 'next/server';
import { getMockData, applyMockVariation } from '@/lib/mock-data';
import { fetchRealPriceData } from '@/lib/finnhub';
import { fetchRealSentimentData } from '@/lib/newsapi';
import { computeSignal } from '@/lib/signals';

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();
  const base   = getMockData(ticker);

  if (!base) {
    return NextResponse.json(
      { error: `Ticker "${ticker}" not found. Available: AAPL, TSLA, NVDA, MSFT, GME` },
      { status: 404 },
    );
  }

  const mockBase = applyMockVariation(base);

  const [priceResult, sentimentResult] = await Promise.allSettled([
    fetchRealPriceData(ticker),
    fetchRealSentimentData(ticker, base.companyName),
  ]);

  if (priceResult.status === 'rejected') {
    console.warn(`[finnhub] mock price for ${ticker}:`, priceResult.reason);
  }
  if (sentimentResult.status === 'rejected') {
    console.warn(`[newsapi] mock sentiment for ${ticker}:`, sentimentResult.reason);
  }

  const priceFields = priceResult.status === 'fulfilled'
    ? { currentPrice: priceResult.value.currentPrice, priceChangePercent: priceResult.value.priceChangePercent }
    : {};

  const sentimentFields = sentimentResult.status === 'fulfilled'
    ? {
        sentimentScore:       sentimentResult.value.sentimentScore,
        mentionCount:         sentimentResult.value.mentionCount,
        headlines:            sentimentResult.value.headlines,
        sentimentExplanation: sentimentResult.value.sentimentExplanation,
        signal:               computeSignal(sentimentResult.value.mentionCount, sentimentResult.value.sentimentScore),
      }
    : {};

  return NextResponse.json({ ...mockBase, ...priceFields, ...sentimentFields });
}
