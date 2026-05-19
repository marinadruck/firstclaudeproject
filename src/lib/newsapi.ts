import type { Headline, SentimentExplanation } from '@/types';

export interface RealSentimentData {
  sentimentScore:       number;
  mentionCount:         number;
  headlines:            Headline[];
  sentimentExplanation: SentimentExplanation;
}

const cache = new Map<string, { data: RealSentimentData; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

const POSITIVE_KEYWORDS = [
  'beat', 'beats', 'surge', 'surged', 'surges', 'gain', 'gains', 'gained',
  'rally', 'rallied', 'upgrade', 'upgraded', 'outperform', 'growth', 'profit',
  'profits', 'profitable', 'breakthrough', 'launch', 'launched', 'partnership',
  'approved', 'approval', 'soared', 'soar', 'rose', 'rise', 'increase',
  'increased', 'boosted', 'record', 'bullish', 'win', 'wins', 'won', 'boom',
];

const NEGATIVE_KEYWORDS = [
  'miss', 'misses', 'missed', 'decline', 'declined', 'declines', 'dropped',
  'drop', 'fell', 'fall', 'loss', 'losses', 'downgrade', 'downgraded',
  'underperform', 'weak', 'lawsuit', 'investigation', 'recall', 'warning',
  'bearish', 'crashed', 'crash', 'fraud', 'scandal', 'delayed', 'delay',
  'layoffs', 'layoff', 'disappoints', 'disappointed', 'plunged', 'plunge',
  'slump', 'penalty', 'bankruptcy', 'bankrupt', 'trouble', 'fine',
];

function scoreHeadline(title: string): number {
  const words = title.toLowerCase().split(/\W+/);
  let score = 0;
  for (const word of words) {
    if (POSITIVE_KEYWORDS.includes(word)) score += 0.15;
    if (NEGATIVE_KEYWORDS.includes(word)) score -= 0.15;
  }
  return Math.max(-1, Math.min(1, score));
}

function buildExplanation(
  headlines: Headline[],
  scores: number[],
  aggregate: number,
): SentimentExplanation {
  // Find dominant keyword theme
  const allWords = headlines.flatMap(h => h.title.toLowerCase().split(/\W+/));
  const allKeywords = aggregate >= 0 ? POSITIVE_KEYWORDS : NEGATIVE_KEYWORDS;
  const counts = allKeywords.map(kw => ({ kw, n: allWords.filter(w => w === kw).length }));
  counts.sort((a, b) => b.n - a.n);
  const topTheme = counts[0]?.n > 0 ? counts[0].kw : null;

  const n = headlines.length;
  let summary: string;
  if (aggregate > 0.1) {
    summary = topTheme
      ? `Sentiment is positive based on ${n} recent articles. Coverage highlights ${topTheme} and related developments.`
      : `Sentiment is positive based on ${n} recent articles. Coverage reflects broadly optimistic developments.`;
  } else if (aggregate < -0.1) {
    summary = topTheme
      ? `Sentiment is negative based on ${n} recent articles. Coverage reflects concerns around ${topTheme}.`
      : `Sentiment is negative based on ${n} recent articles. Coverage reflects broadly cautious developments.`;
  } else {
    summary = `Sentiment is mixed based on ${n} recent articles. Coverage is balanced with no dominant theme.`;
  }

  // Top 3–5 headlines by absolute score as key drivers
  const ranked = scores
    .map((s, i) => ({ score: Math.abs(s), headline: headlines[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const keyDrivers = ranked.map(
    ({ headline: h }) => `${h.title} (${h.source})`,
  );

  return { summary, keyDrivers };
}

export async function fetchRealSentimentData(
  ticker: string,
  companyName: string,
): Promise<RealSentimentData> {
  const cached = cache.get(ticker);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const key = process.env.NEWS_API_KEY;
  if (!key) throw new Error('NEWS_API_KEY not set');

  const firstWord = companyName.split(' ')[0];
  const query     = `${ticker} OR "${firstWord}"`;
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=25&apiKey=${key}`;

  const res  = await fetch(url);
  const json = await res.json();

  if (!res.ok || json.status !== 'ok') {
    throw new Error(`NewsAPI error: ${json.message ?? res.status}`);
  }

  const articles: Array<{
    title: string;
    source: { name: string };
    url: string;
    publishedAt: string;
  }> = json.articles ?? [];

  if (articles.length === 0) throw new Error('No articles returned');

  const headlines: Headline[] = articles.map(a => ({
    title:       a.title,
    source:      a.source.name,
    url:         a.url,
    publishedAt: a.publishedAt,
  }));

  const scores    = headlines.map(h => scoreHeadline(h.title));
  const aggregate = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const sentimentScore = Math.round(aggregate * 1000) / 1000;

  const sentimentExplanation = buildExplanation(headlines, scores, aggregate);

  const data: RealSentimentData = {
    sentimentScore,
    mentionCount: headlines.length,
    headlines,
    sentimentExplanation,
  };

  cache.set(ticker, { data, fetchedAt: Date.now() });
  return data;
}
