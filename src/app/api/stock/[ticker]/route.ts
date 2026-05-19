import { NextRequest, NextResponse } from 'next/server';
import { getMockData, applyMockVariation } from '@/lib/mock-data';
import { fetchRealPriceData } from '@/lib/finnhub';

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

  try {
    const real = await fetchRealPriceData(ticker);
    return NextResponse.json({
      ...applyMockVariation(base),
      currentPrice:       real.currentPrice,
      priceChangePercent: real.priceChangePercent,
    });
  } catch (err) {
    console.warn(`[finnhub] Falling back to mock for ${ticker}:`, err);
    return NextResponse.json(applyMockVariation(base));
  }
}
