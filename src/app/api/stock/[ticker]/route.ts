import { NextRequest, NextResponse } from 'next/server';
import { getMockData, applyMockVariation } from '@/lib/mock-data';
import { fetchRealPriceData, fetchCompanyProfile } from '@/lib/finnhub';
import { fetchPriceHistory } from '@/lib/alphavantage';
import { fetchRealSentimentData } from '@/lib/newsapi';
import { fetchRedditSentimentData } from '@/lib/reddit';
import { computeSignal } from '@/lib/signals';
import { computeRecommendation } from '@/lib/recommendations';
import { aggregateAdvancedSentiment } from '@/lib/ai-sentiment';
import type { Headline, SentimentExplanation, AdvancedSentimentSummary, Signal, OutlookDirection, ConfidenceLevel } from '@/types';

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

  let companyName: string;
  try {
    const profile = await fetchCompanyProfile(ticker);
    if (!profile.exists) {
      return NextResponse.json(
        { error: `Ticker "${ticker}" not found. Enter any US stock ticker (e.g. AAPL, AMZN, GOOG)` },
        { status: 404 },
      );
    }
    companyName = profile.companyName;
  } catch {
    // Profile fetch failed (no key, network) — fall back to mock existence check
    const mockFallback = getMockData(ticker);
    if (!mockFallback) {
      return NextResponse.json(
        { error: `Ticker "${ticker}" not found. Enter any US stock ticker (e.g. AAPL, AMZN, GOOG)` },
        { status: 404 },
      );
    }
    companyName = mockFallback.companyName;
  }

  const mockData = getMockData(ticker);
  const baseDefaults = mockData
    ? { ...applyMockVariation(mockData), companyName }
    : {
        ticker,
        companyName,
        currentPrice: 0,
        priceChangePercent: 0,
        mentionCount: 0,
        newsMentionCount: 0,
        redditMentionCount: 0,
        sentimentScore: 0,
        signal: 'Watch' as Signal,
        headlines: [],
        priceHistory: [],
        sentimentExplanation: { summary: 'Awaiting sentiment data.', keyDrivers: [] },
        priceOutlook: { direction: 'Neutral' as OutlookDirection, confidence: 'Low' as ConfidenceLevel, explanation: 'Insufficient data to form an outlook.' },
        recommendation: { action: 'Hold', reasoning: 'Insufficient data to make a recommendation.' },
      };

  const [priceResult, newsResult, redditResult, historyResult] = await Promise.allSettled([
    fetchRealPriceData(ticker),
    fetchRealSentimentData(ticker, companyName),
    fetchRedditSentimentData(ticker),
    fetchPriceHistory(ticker),
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
  if (historyResult.status === 'rejected') {
    console.warn(`[alphavantage] mock price history for ${ticker}:`, historyResult.reason);
  }

  const realHistory        = historyResult.status === 'fulfilled' ? historyResult.value : null;
  const priceHistoryFields = {
    priceHistory:       realHistory ?? (mockData?.priceHistory ?? []),
    priceHistorySource: (realHistory ? 'real' : 'mock') as 'real' | 'mock',
  };

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
    advancedSentiment: AdvancedSentimentSummary;
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
      advancedSentiment:    aggregateAdvancedSentiment(
        allHeadlines.map(h => h.title),
        combinedScore,
      ),
    };
  }

  const recommendationFields = ('sentimentScore' in sentimentFields)
    ? computeRecommendation({
        sentimentScore:     sentimentFields.sentimentScore!,
        mentionCount:       sentimentFields.mentionCount!,
        newsMentionCount:   sentimentFields.newsMentionCount!,
        redditMentionCount: sentimentFields.redditMentionCount!,
        signal:             sentimentFields.signal!,
        priceChangePercent: priceResult.status === 'fulfilled'
          ? priceResult.value.priceChangePercent
          : (mockData?.priceChangePercent ?? 0),
      })
    : {};

  return NextResponse.json({ ...baseDefaults, ...priceHistoryFields, ...priceFields, ...sentimentFields, ...recommendationFields });
}
