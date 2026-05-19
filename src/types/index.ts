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

export interface BacktestTrade {
  date: string;
  direction: OutlookDirection;
  confidence: ConfidenceLevel;
  action: string;
  forwardReturnPct: number;
  actualOutcome: OutlookDirection;
  isWin: boolean;
}

export interface BacktestMetrics {
  totalSignals: number;
  directionalSignals: number;
  wins: number;
  winRate: number;
  avgReturn: number;
  avgBullishReturn: number;
  avgBearishReturn: number;
  bestTrade: number;
  worstTrade: number;
  maxDrawdown: number;
}

export interface BacktestResult {
  ticker: string;
  dataSource: 'mock' | 'real';
  holdingDays: number;
  from: string;
  to: string;
  trades: BacktestTrade[];
  metrics: BacktestMetrics;
}

// Returned by scoreAdvancedSentiment() for a single text input.
// Replace the body of that function with an async LLM/FinBERT call to upgrade later.
export interface AdvancedSentimentResult {
  label: 'Positive' | 'Neutral' | 'Negative';
  score: number;            // -1.0 to +1.0
  confidence: ConfidenceLevel;
  explanation: string;
  reasons: string[];        // which rules/signals fired
  method: 'advanced-local';
}

// Aggregated across all headlines in one API response
export interface AdvancedSentimentSummary {
  score: number;
  basicScore: number;       // original keyword-based score for comparison
  label: 'Positive' | 'Neutral' | 'Negative';
  confidence: ConfidenceLevel;
  method: 'advanced-local';
  topReasons: string[];     // deduplicated, sorted by frequency
}

export interface MLFeatureInput {
  combinedSentimentScore: number;
  priceChangePct: number;
  newsMentionCount: number;
  redditMentionCount: number;
}

export interface MLFeatureContribution {
  name: string;
  value: number;
  contribution: number;
}

export interface MLPrediction {
  ticker: string;
  dataSource: 'mock';
  predictionDate: string;
  features: MLFeatureInput;
  probabilityUp: number;
  predictedDirection: OutlookDirection;
  confidence: ConfidenceLevel;
  expectedReturnPct: number;
  featureContributions: MLFeatureContribution[];
  modelExplanation: string;
  trainingSize: number;
  ruleBasedDirection: OutlookDirection;
  ruleBasedAction: string;
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
  advancedSentiment?: AdvancedSentimentSummary;
}
