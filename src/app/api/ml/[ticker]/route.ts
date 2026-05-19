import { NextRequest, NextResponse } from 'next/server';
import { predictML } from '@/lib/ml';

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();

  try {
    const prediction = predictML(ticker);
    return NextResponse.json(prediction);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prediction failed';
    const status  = message.startsWith('No mock training data') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
