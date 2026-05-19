import { NextRequest, NextResponse } from 'next/server';
import { getMockData } from '@/lib/mock-data';

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();
  const data = getMockData(ticker);

  if (!data) {
    return NextResponse.json(
      { error: `Ticker "${ticker}" not found. Available: AAPL, TSLA, NVDA, MSFT, GME` },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}
