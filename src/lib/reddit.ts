import type { Headline } from '@/types';
import { scoreHeadline } from '@/lib/newsapi';

export interface RedditSentimentData {
  sentimentScore: number;  // -1.0 to +1.0
  mentionCount:   number;
  headlines:      Headline[];
}

const SUBREDDITS = ['wallstreetbets', 'stocks', 'investing'];
const cache = new Map<string, { data: RedditSentimentData; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchRedditSentimentData(ticker: string): Promise<RedditSentimentData> {
  const cached = cache.get(ticker);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.data;

  const results = await Promise.allSettled(
    SUBREDDITS.map(sub =>
      fetch(
        `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(ticker)}&sort=new&t=day&restrict_sr=true&limit=25`,
        { headers: { 'User-Agent': 'StockSentimentDashboard/1.0' } },
      ).then(r => r.json()),
    ),
  );

  const headlines: Headline[] = [];
  for (const result of results) {
    if (result.status === 'rejected') continue;
    const posts: Array<{ data: Record<string, unknown> }> = result.value?.data?.children ?? [];
    for (const { data: p } of posts) {
      if (!p?.title) continue;
      headlines.push({
        title:       p.title as string,
        source:      `r/${p.subreddit as string}`,
        url:         `https://www.reddit.com${p.permalink as string}`,
        publishedAt: new Date((p.created_utc as number) * 1000).toISOString(),
      });
    }
  }

  if (headlines.length === 0) throw new Error('No Reddit posts returned');

  const scores    = headlines.map(h => scoreHeadline(h.title));
  const aggregate = scores.reduce((s, v) => s + v, 0) / scores.length;

  const data: RedditSentimentData = {
    sentimentScore: Math.round(aggregate * 1000) / 1000,
    mentionCount:   headlines.length,
    headlines,
  };

  cache.set(ticker, { data, fetchedAt: Date.now() });
  return data;
}
