// Only currentPrice and priceChangePercent are available on the Finnhub free tier.
// Historical candles (/stock/candle) require a paid plan; priceHistory stays mock.
export interface RealPriceData {
  currentPrice:       number;
  priceChangePercent: number;
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

  const res  = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${key}`);
  const json = await res.json();
  if (!res.ok || !json.c) throw new Error('Quote fetch failed');

  const data: RealPriceData = {
    currentPrice:       Math.round(json.c  * 100) / 100,
    priceChangePercent: Math.round(json.dp * 100) / 100,
  };

  cache.set(ticker, { data, fetchedAt: Date.now() });
  return data;
}

export interface CompanyProfile {
  companyName: string;
  exists:      boolean;
}

const profileCache = new Map<string, { data: CompanyProfile; fetchedAt: number }>();
const PROFILE_CACHE_TTL_MS = 24 * 60 * 60_000;

export async function fetchCompanyProfile(ticker: string): Promise<CompanyProfile> {
  const cached = profileCache.get(ticker);
  if (cached && Date.now() - cached.fetchedAt < PROFILE_CACHE_TTL_MS) {
    return cached.data;
  }

  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY not set');

  const res  = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${key}`);
  const json = await res.json();

  // Finnhub returns {} for unknown tickers; name field is absent
  const exists = res.ok && typeof json.name === 'string' && json.name.length > 0;
  const data: CompanyProfile = { companyName: exists ? json.name : ticker, exists };
  profileCache.set(ticker, { data, fetchedAt: Date.now() });
  return data;
}
