import { NextRequest, NextResponse } from 'next/server';
import { getMockData, applyMockVariation } from '@/lib/mock-data';
import { fetchRealPriceData } from '@/lib/finnhub';
import { fetchRealSentimentData } from '@/lib/newsapi';
import { fetchRedditSentimentData } from '@/lib/reddit';
import { computeSignal } from '@/lib/signals';
import type { Headline, SentimentExplanation } from '@/types';

function buildSummary(
  combined: number,
  newsCount: number,
  redditCount: number,
  newsSummary: string,
): string {
  if (redditCount === 0) return newsSummary;
  const direction = combined > 0.1 ? 'positive' : combined < -0.1 ? 'negative' : 'mixed';
  const sources   = `${newsCount} news articles and ${redditCount} Reddit ${redditCount === 1 ? 'post' : 'posts'}`;
  return newsSummary
    .replace(/^Sentiment is \w+/, `Sentiment is ${direction}`)
    .replace(/based on \d+ recent articles/, `based on ${sources}`);
}

function buildDrivers(newsDrivers: string[], redditHeadlines: Headline[]): string[] {
  const top3News   = newsDrivers.slice(0, 3);
  const top2Reddit = redditHeadlines.slice(0, 2).map(h => `${h.title} (${h.source})`);
  return [...top3News, ...top2Reddit];
}

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

  const [priceResult, newsResult, redditResult] = await Promise.allSettled([
    fetchRealPriceData(ticker),
    fetchRealSentimentData(ticker, base.companyName),
    fetchRedditSentimentData(ticker),
  ]);

  if (priceResult.status === 'rejected') {
    console.warn(`[finnhub] mock price for ${ticker}:`, priceResult.reason);
  }
  if (newsResult.status === 'rejected') {
    console.warn(`[newsapi] mock sentiment for ${ticker}:`, newsResult.reason);
  }
  if (redditResult.status === 'rejected') {
    console.warn(`[reddit] no Reddit data for ${ticker}:`, redditResult.reason);
  }

  const priceFields = priceResult.status === 'fulfilled'
    ? { currentPrice: priceResult.value.currentPrice, priceChangePercent: priceResult.value.priceChangePercent }
    : {};

  let sentimentFields: Partial<{
    sentimentScore: number;
    mentionCount: number;
    newsMentionCount: number;
    redditMentionCount: number;
    headlines: Headline[];
    sentimentExplanation: SentimentExplanation;
    signal: ReturnType<typeof computeSignal>;
  }> = {};

  if (newsResult.status === 'fulfilled') {
    const news   = newsResult.value;
    const reddit = redditResult.status === 'fulfilled' ? redditResult.value : null;

    const combinedScore  = reddit
      ? +(0.7 * news.sentimentScore + 0.3 * reddit.sentimentScore).toFixed(3)
      : news.sentimentScore;
    const redditCount    = reddit?.mentionCount ?? 0;
    const totalCount     = news.mentionCount + redditCount;
    const allHeadlines   = reddit ? [...news.headlines, ...reddit.headlines] : news.headlines;
    const summary        = buildSummary(combinedScore, news.mentionCount, redditCount, news.sentimentExplanation.summary);
    const keyDrivers     = buildDrivers(news.sentimentExplanation.keyDrivers, reddit?.headlines ?? []);

    sentimentFields = {
      sentimentScore:       combinedScore,
      mentionCount:         totalCount,
      newsMentionCount:     news.mentionCount,
      redditMentionCount:   redditCount,
      headlines:            allHeadlines,
      sentimentExplanation: { summary, keyDrivers },
      signal:               computeSignal(totalCount, combinedScore),
    };
  }

  return NextResponse.json({ ...mockBase, ...priceFields, ...sentimentFields });
}
