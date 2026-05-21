import type { PricePoint } from '@/types';

const cache = new Map<string, { data: PricePoint[]; fetchedAt: number }>();
const CACHE_TTL_MS = 12 * 60 * 60_000; // 12 hours — AV free tier is 25 req/day

export async function fetchPriceHistory(ticker: string, days = 30): Promise<PricePoint[]> {
  const cached = cache.get(ticker);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_API_KEY not set');

  const res  = await fetch(
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${key}`,
  );
  const json = await res.json();

  // AV returns a "Note" on rate limit, "Information" on invalid key
  if (json['Note'] || json['Information']) throw new Error('Alpha Vantage rate limit or API key error');

  const series = json['Time Series (Daily)'];
  if (!series || typeof series !== 'object') throw new Error('Unexpected Alpha Vantage response');

  const data: PricePoint[] = (Object.entries(series) as [string, Record<string, string>][])
    .map(([date, vals]) => ({
      date,
      price: Math.round(parseFloat(vals['4. close']) * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days);

  cache.set(ticker, { data, fetchedAt: Date.now() });
  return data;
}
