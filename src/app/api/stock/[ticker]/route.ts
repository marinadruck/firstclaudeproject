import { NextRequest, NextResponse } from 'next/server';
import { getMockData, applyMockVariation } from '@/lib/mock-data';

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();
  const base = getMockData(ticker);

  if (!base) {
    return NextResponse.json(
      { error: `Ticker "${ticker}" not found. Available: AAPL, TSLA, NVDA, MSFT, GME` },
      { status: 404 },
    );
  }

  // Simulate a live data stream by adding small random variation on each request.
  // When real APIs are connected, replace applyMockVariation with actual data fetching.
  return NextResponse.json(applyMockVariation(base));
}
