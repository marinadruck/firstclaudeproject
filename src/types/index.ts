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

export interface StockData {
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChangePercent: number;
  mentionCount: number;
  sentimentScore: number;
  signal: Signal;
  headlines: Headline[];
  priceHistory: PricePoint[];
}
