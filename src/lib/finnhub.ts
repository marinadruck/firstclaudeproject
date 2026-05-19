export interface RealPriceData {
  currentPrice:       number;
  priceChangePercent: number;
  priceHistory:       { date: string; price: number }[];
}

const cache = new Map<string, { data: RealPriceData; fetchedAt: number }>();
const CACHE_TTL_MS = 30_000;

export async function fetchRealPriceData(ticker: string): Promise<RealPriceData> {
  const cached = cache.get(ticker);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY not set');

  const BASE = 'https://finnhub.io/api/v1';

  const quoteRes  = await fetch(`${BASE}/quote?symbol=${ticker}&token=${key}`);
  const quoteJson = await quoteRes.json();
  if (!quoteRes.ok || !quoteJson.c) throw new Error('Quote fetch failed');

  const to   = Math.floor(Date.now() / 1000);
  const from = to - 30 * 24 * 60 * 60;
  const candleRes  = await fetch(`${BASE}/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${key}`);
  const candleJson = await candleRes.json();
  if (!candleRes.ok || candleJson.s !== 'ok') throw new Error('Candle fetch failed');

  const priceHistory = (candleJson.t as number[]).map((ts: number, i: number) => ({
    date:  new Date(ts * 1000).toISOString().split('T')[0],
    price: Math.round((candleJson.c[i] as number) * 100) / 100,
  }));

  const data: RealPriceData = {
    currentPrice:       Math.round(quoteJson.c  * 100) / 100,
    priceChangePercent: Math.round(quoteJson.dp * 100) / 100,
    priceHistory,
  };

  cache.set(ticker, { data, fetchedAt: Date.now() });
  return data;
}
