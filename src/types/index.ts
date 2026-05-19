export interface Headline {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface PricePoint {
  date: string;
  price: number;
}

export type Signal = 'High Attention' | 'Watch' | 'Low Attention';

export interface SentimentExplanation {
  summary: string;
  keyDrivers: string[];
}

export type OutlookDirection = 'Bullish' | 'Neutral' | 'Bearish';
export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export interface PriceOutlook {
  direction: OutlookDirection;
  confidence: ConfidenceLevel;
  explanation: string;
}

export interface DecisionRecommendation {
  action: string;
  reasoning: string;
}

export interface StockData {
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChangePercent: number;
  mentionCount: number;        // total = newsMentionCount + redditMentionCount
  newsMentionCount: number;
  redditMentionCount: number;
  sentimentScore: number;
  signal: Signal;
  headlines: Headline[];
  priceHistory: PricePoint[];
  sentimentExplanation: SentimentExplanation;
  priceOutlook: PriceOutlook;
  recommendation: DecisionRecommendation;
}
