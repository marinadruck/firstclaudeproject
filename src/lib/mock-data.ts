import type { StockData } from '@/types';
import { computeSignal } from './signals';

const DATES = [
  '2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24',
  '2026-04-25', '2026-04-26', '2026-04-27', '2026-04-28', '2026-04-29',
  '2026-04-30', '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04',
  '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08', '2026-05-09',
  '2026-05-10', '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14',
  '2026-05-15', '2026-05-16', '2026-05-17', '2026-05-18', '2026-05-19',
];

function makePriceHistory(prices: number[]) {
  return prices.map((price, i) => ({ date: DATES[i], price }));
}

const MOCK_DB: Record<string, StockData> = {
  AAPL: {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    currentPrice: 184.50,
    priceChangePercent: 0.33,
    mentionCount: 142,
    newsMentionCount: 97,
    redditMentionCount: 45,
    sentimentScore: 0.67,
    signal: computeSignal(142, 0.67),
    priceHistory: makePriceHistory([
      178.50, 179.20, 177.80, 180.10, 181.30,
      179.90, 182.40, 183.10, 181.70, 184.20,
      183.50, 185.00, 184.30, 182.90, 183.60,
      184.80, 183.20, 184.50, 185.30, 186.10,
      185.70, 184.90, 186.40, 185.80, 184.60,
      185.20, 186.00, 184.30, 183.90, 184.50,
    ]),
    headlines: [
      { title: 'Apple Reports Record Q2 Earnings Driven by iPhone 16 Sales', source: 'Reuters', url: '#', publishedAt: '2026-05-18' },
      { title: 'Apple Vision Pro 2 Rumors Surface Ahead of WWDC', source: 'TechCrunch', url: '#', publishedAt: '2026-05-17' },
      { title: 'Analysts Raise Apple Price Target to $220 on AI Integration Plans', source: 'Bloomberg', url: '#', publishedAt: '2026-05-16' },
      { title: "Apple's Services Revenue Hits New High as App Store Grows 22% YoY", source: 'CNBC', url: '#', publishedAt: '2026-05-15' },
      { title: 'r/wallstreetbets: AAPL looking bullish into earnings — here is my DD', source: 'Reddit', url: '#', publishedAt: '2026-05-14' },
      { title: 'Apple Expands Manufacturing in India, Reducing China Dependency', source: 'Financial Times', url: '#', publishedAt: '2026-05-13' },
    ],
    sentimentExplanation: {
      summary: 'Mostly positive, driven by a strong earnings beat and anticipation of the upcoming WWDC developer conference.',
      keyDrivers: [
        'Q2 earnings exceeded analyst expectations on both revenue and EPS',
        'Vision Pro 2 rumours building ahead of WWDC',
        'Multiple analysts raised price targets citing AI integration roadmap',
        'Services revenue hit a new all-time high',
      ],
    },
    priceOutlook: {
      direction: 'Bullish',
      confidence: 'Medium',
      explanation: 'Positive sentiment, high attention volume, and steady price appreciation over 30 days suggest continued upward momentum heading into WWDC season.',
    },
    recommendation: {
      action: 'Monitor Closely',
      reasoning: 'Positive signals across sentiment, attention, and price trend. Consider waiting for a clear breakout above recent highs before acting, rather than chasing current momentum.',
    },
  },

  TSLA: {
    ticker: 'TSLA',
    companyName: 'Tesla, Inc.',
    currentPrice: 248.90,
    priceChangePercent: 3.07,
    mentionCount: 235,
    newsMentionCount: 85,
    redditMentionCount: 150,
    sentimentScore: 0.28,
    signal: computeSignal(235, 0.28),
    priceHistory: makePriceHistory([
      215.30, 218.70, 212.40, 221.80, 225.60,
      219.30, 228.90, 232.10, 225.40, 235.80,
      229.50, 238.20, 233.70, 227.90, 231.40,
      236.80, 230.20, 238.50, 242.30, 238.70,
      233.50, 240.80, 237.60, 242.90, 238.40,
      244.10, 239.80, 246.30, 241.50, 248.90,
    ]),
    headlines: [
      { title: 'Tesla Cybertruck Demand Surges in Q1, Musk Says Production On Track', source: 'Reuters', url: '#', publishedAt: '2026-05-18' },
      { title: 'Tesla FSD v13 Achieves Major Milestone in Autonomous Driving Tests', source: 'Electrek', url: '#', publishedAt: '2026-05-17' },
      { title: 'Tesla Opens 500th Supercharger Station in Europe', source: 'TechCrunch', url: '#', publishedAt: '2026-05-16' },
      { title: 'Musk Announces Tesla Energy Storage Record Quarter — Up 180% YoY', source: 'Bloomberg', url: '#', publishedAt: '2026-05-15' },
      { title: 'r/stocks: TSLA short squeeze potential building — 15% of float short', source: 'Reddit', url: '#', publishedAt: '2026-05-14' },
      { title: 'Wall Street Divided on Tesla: Bulls See AI Play, Bears See Overvaluation', source: 'WSJ', url: '#', publishedAt: '2026-05-13' },
      { title: 'Tesla Model 3 Highland Refresh Earns 5-Star Safety Rating in Europe', source: 'CNBC', url: '#', publishedAt: '2026-05-12' },
    ],
    sentimentExplanation: {
      summary: 'Mixed sentiment — very high attention but divided opinion between FSD optimists and valuation sceptics.',
      keyDrivers: [
        'FSD v13 milestone driving excitement among long-term holders',
        'Short interest at 15% of float creating potential squeeze conditions',
        'Institutional analysts divided between growth narrative and overvaluation concerns',
        'Energy storage business growth receiving less coverage than its results deserve',
      ],
    },
    priceOutlook: {
      direction: 'Bullish',
      confidence: 'Low',
      explanation: 'Very high mention volume and positive price momentum suggest short-term upward pressure, but mixed sentiment significantly reduces conviction in this outlook.',
    },
    recommendation: {
      action: 'Wait for Confirmation',
      reasoning: 'Extreme attention with divided sentiment often precedes sharp moves in either direction. Avoid reacting to social media hype alone — wait for a clear directional break in price before acting.',
    },
  },

  NVDA: {
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    currentPrice: 904.20,
    priceChangePercent: 1.63,
    mentionCount: 89,
    newsMentionCount: 64,
    redditMentionCount: 25,
    sentimentScore: 0.81,
    signal: computeSignal(89, 0.81),
    priceHistory: makePriceHistory([
      823.50, 835.70, 819.30, 842.60, 856.40,
      839.80, 861.20, 875.50, 858.90, 882.30,
      869.10, 891.40, 877.60, 865.30, 872.80,
      888.50, 875.20, 893.80, 907.40, 895.60,
      883.20, 898.70, 912.30, 899.50, 886.80,
      901.40, 915.60, 902.30, 889.70, 904.20,
    ]),
    headlines: [
      { title: 'Nvidia Blackwell GPUs Sell Out Through 2026, CEO Jensen Huang Confirms', source: 'Reuters', url: '#', publishedAt: '2026-05-18' },
      { title: 'Nvidia H200 NVL Adopted by All Major Cloud Providers Simultaneously', source: 'The Verge', url: '#', publishedAt: '2026-05-17' },
      { title: 'Nvidia AI Revenue Grows 400% YoY in Latest Quarterly Earnings', source: 'Bloomberg', url: '#', publishedAt: '2026-05-16' },
      { title: 'NVDA Technical Analysis: Stock Forms Cup-and-Handle on Daily Chart', source: "Investor's Business Daily", url: '#', publishedAt: '2026-05-15' },
      { title: 'Nvidia Expands Into AI Inference Market With New Software Stack', source: 'TechCrunch', url: '#', publishedAt: '2026-05-14' },
      { title: 'r/wallstreetbets: NVDA is the new oil — entered calls this morning', source: 'Reddit', url: '#', publishedAt: '2026-05-13' },
    ],
    sentimentExplanation: {
      summary: 'Strongly positive — AI chip demand narrative is dominating both institutional research and retail attention.',
      keyDrivers: [
        'Blackwell GPU sellout confirms sustained enterprise demand well into 2026',
        '400% YoY AI data centre revenue growth reported in latest earnings',
        'All major cloud providers adopting H200 NVL architecture simultaneously',
        'Bullish technical chart pattern forming on the daily timeframe',
      ],
    },
    priceOutlook: {
      direction: 'Bullish',
      confidence: 'High',
      explanation: 'Strong positive sentiment, consistent price appreciation over 30 days, and growing attention volume all point to continued institutional buying interest.',
    },
    recommendation: {
      action: 'Compare with Fundamentals',
      reasoning: 'All sentiment and attention signals are positive, but a meaningful portion of the good news may already be priced in. Compare current P/E against forward earnings estimates before acting.',
    },
  },

  MSFT: {
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    currentPrice: 435.60,
    priceChangePercent: 1.75,
    mentionCount: 45,
    newsMentionCount: 38,
    redditMentionCount: 7,
    sentimentScore: 0.54,
    signal: computeSignal(45, 0.54),
    priceHistory: makePriceHistory([
      401.30, 405.70, 399.80, 408.40, 412.90,
      407.60, 414.20, 418.50, 412.30, 421.80,
      416.50, 423.90, 419.70, 414.80, 417.30,
      422.60, 416.90, 424.50, 429.30, 424.70,
      419.50, 425.30, 421.80, 428.40, 423.10,
      430.50, 426.80, 432.90, 428.10, 435.60,
    ]),
    headlines: [
      { title: 'Microsoft Azure AI Revenue Tops $10B Quarterly Run Rate for First Time', source: 'CNBC', url: '#', publishedAt: '2026-05-18' },
      { title: 'Microsoft Copilot Reaches 100 Million Enterprise Users Milestone', source: 'Reuters', url: '#', publishedAt: '2026-05-17' },
      { title: 'Microsoft and OpenAI Extend Strategic Partnership Agreement Through 2030', source: 'Bloomberg', url: '#', publishedAt: '2026-05-16' },
      { title: 'Analysts Maintain Buy Rating on MSFT Despite Near-Term Valuation Concerns', source: "Barron's", url: '#', publishedAt: '2026-05-15' },
      { title: 'Microsoft Teams Surpasses Slack in Enterprise Adoption With New AI Features', source: 'TechCrunch', url: '#', publishedAt: '2026-05-14' },
    ],
    sentimentExplanation: {
      summary: 'Moderately positive — steady institutional coverage without the social media excitement seen in AI-adjacent peers.',
      keyDrivers: [
        'Azure AI revenue reached a meaningful new quarterly milestone',
        'Copilot enterprise adoption growing steadily across Fortune 500 companies',
        'OpenAI partnership extended, securing long-term AI pipeline advantage',
        'Analyst consensus remains firmly Buy with low controversy or downside revisions',
      ],
    },
    priceOutlook: {
      direction: 'Neutral',
      confidence: 'Medium',
      explanation: 'Moderate attention and positive sentiment suggest stable, low-volatility price movement. No clear catalyst visible for a sharp move in either direction near-term.',
    },
    recommendation: {
      action: 'No Urgent Action',
      reasoning: 'Fundamentals appear solid and sentiment is positive, but low mention volume indicates limited near-term catalyst. This may suit a patient, long-term monitoring approach.',
    },
  },

  GME: {
    ticker: 'GME',
    companyName: 'GameStop Corp.',
    currentPrice: 19.40,
    priceChangePercent: 2.65,
    mentionCount: 312,
    newsMentionCount: 62,
    redditMentionCount: 250,
    sentimentScore: 0.44,
    signal: computeSignal(312, 0.44),
    priceHistory: makePriceHistory([
      14.20, 15.80, 13.90, 16.40, 17.30,
      15.70, 18.20, 19.80, 17.50, 21.30,
      19.60, 22.10, 20.40, 18.30, 19.80,
      21.50, 19.20, 22.80, 24.30, 22.60,
      20.10, 21.80, 23.40, 21.90, 19.50,
      20.80, 22.30, 20.50, 18.90, 19.40,
    ]),
    headlines: [
      { title: 'GameStop Announces $1B Investment in Crypto and Digital Asset Infrastructure', source: 'Reuters', url: '#', publishedAt: '2026-05-18' },
      { title: 'Ryan Cohen Purchases Additional 5 Million GameStop Shares', source: 'Bloomberg', url: '#', publishedAt: '2026-05-17' },
      { title: 'r/wallstreetbets: GME 🚀🚀🚀 short interest back to 2021 levels — buckle up', source: 'Reddit', url: '#', publishedAt: '2026-05-16' },
      { title: 'GameStop Reports Surprise Profitable Quarter, Shares Surge 25% After-Hours', source: 'CNBC', url: '#', publishedAt: '2026-05-15' },
      { title: 'Short Interest in GameStop Reaches Highest Level Since January 2021', source: 'Reuters', url: '#', publishedAt: '2026-05-14' },
      { title: 'Roaring Kitty Posts Cryptic Tweet, GME Jumps 18% in Pre-Market Trading', source: 'WSJ', url: '#', publishedAt: '2026-05-13' },
      { title: 'GameStop Opens First Collectibles Pop-Up Store in New York City', source: 'AP News', url: '#', publishedAt: '2026-05-12' },
      { title: "r/stocks: GME fundamentals don't justify current price — bear thesis", source: 'Reddit', url: '#', publishedAt: '2026-05-11' },
    ],
    sentimentExplanation: {
      summary: 'High attention with mixed signals — meme-driven excitement is dominating, but a fundamental bear thesis is clearly visible beneath the surface.',
      keyDrivers: [
        'Ryan Cohen share purchase reignited retail investor interest significantly',
        'Short interest back near January 2021 levels, creating squeeze narrative',
        "Roaring Kitty's social post added substantial fuel to the price rally",
        'Bear thesis counters visible in community discussion — weak underlying fundamentals',
      ],
    },
    priceOutlook: {
      direction: 'Bearish',
      confidence: 'Low',
      explanation: 'Extreme attention volume is driven by meme momentum rather than business fundamentals. Historically, price spikes of this type are unstable and tend to reverse sharply.',
    },
    recommendation: {
      action: 'Avoid Reacting to Hype',
      reasoning: 'GME exhibits classic meme-stock patterns: extreme social attention, short squeeze narrative, and weak underlying fundamentals. Decisions based on social sentiment alone carry very high risk.',
    },
  },
};

export function getMockData(ticker: string): StockData | null {
  return MOCK_DB[ticker.toUpperCase()] ?? null;
}

// Adds small random variation to live-updating fields to simulate a data stream.
// Insight text (sentimentExplanation, priceOutlook, recommendation) stays stable.
export function applyMockVariation(data: StockData): StockData {
  const newNewsMentionCount    = Math.max(0, data.newsMentionCount    + Math.floor((Math.random() - 0.5) * 8));
  const newRedditMentionCount  = Math.max(0, data.redditMentionCount  + Math.floor((Math.random() - 0.5) * 10));
  const newMentionCount        = newNewsMentionCount + newRedditMentionCount;
  const newSentimentScore      = Math.max(-1, Math.min(1, data.sentimentScore + (Math.random() - 0.5) * 0.08));
  const newPrice               = Math.round((data.currentPrice + (Math.random() - 0.5) * 1.5) * 100) / 100;

  return {
    ...data,
    mentionCount:       newMentionCount,
    newsMentionCount:   newNewsMentionCount,
    redditMentionCount: newRedditMentionCount,
    sentimentScore:     newSentimentScore,
    currentPrice:       newPrice,
    signal:             computeSignal(newMentionCount, newSentimentScore),
  };
}
