import type { PriceOutlook, DecisionRecommendation, Signal } from '@/types';

export interface RecommendationInput {
  sentimentScore:     number;
  mentionCount:       number;
  newsMentionCount:   number;
  redditMentionCount: number;
  signal:             Signal;
  priceChangePercent: number;
}

export interface RecommendationOutput {
  priceOutlook:   PriceOutlook;
  recommendation: DecisionRecommendation;
}

export function computeRecommendation(input: RecommendationInput): RecommendationOutput {
  const { sentimentScore, newsMentionCount, redditMentionCount, signal, priceChangePercent } = input;

  const isHighAttention   = signal === 'High Attention';
  const isLowAttention    = signal === 'Low Attention';
  const isHighRedditRatio = redditMentionCount >= 5 && redditMentionCount > newsMentionCount * 1.5;

  const isStrongPositive  = sentimentScore >  0.3;
  const isPositive        = sentimentScore >  0.1;
  const isNeutral         = Math.abs(sentimentScore) <= 0.1;
  const isNegative        = sentimentScore < -0.1;
  const isStrongNegative  = sentimentScore < -0.3;

  const isPriceUp         = priceChangePercent >=  0.5;
  const isPriceDown       = priceChangePercent <= -0.5;
  const isPriceStrongUp   = priceChangePercent >=  1.0;
  const isPriceStrongDown = priceChangePercent <= -1.0;

  // Rule 1 — Social hype: high attention driven by Reddit without fundamental news backing
  if (isHighAttention && isHighRedditRatio) {
    return {
      priceOutlook: {
        direction:   'Neutral',
        confidence:  'Low',
        explanation: 'Reddit activity is significantly outpacing institutional news coverage. Social momentum at this volume can drive sharp short-term moves but frequently reverses without a fundamental catalyst.',
      },
      recommendation: {
        action:    'Watch for Hype',
        reasoning: 'Reddit mentions far exceed news coverage. Decisions driven purely by social momentum carry elevated risk — wait for news catalysts to validate the move before drawing conclusions.',
      },
    };
  }

  // Rule 2 — High attention + negative sentiment
  if (isHighAttention && isNegative) {
    return {
      priceOutlook: {
        direction:   'Bearish',
        confidence:  'Low',
        explanation: 'High attention volume combined with negative sentiment suggests widespread concern. Broad negative coverage at elevated activity levels often precedes continued downward pressure.',
      },
      recommendation: {
        action:    'Caution',
        reasoning: 'Wide negative coverage at high attention levels is a cautionary signal. Consider waiting for sentiment to stabilise or a clear price support level before reassessing.',
      },
    };
  }

  // Rule 3 — Strong bullish: strong sentiment + positive price + high attention
  if (isStrongPositive && isPriceUp && isHighAttention) {
    return {
      priceOutlook: {
        direction:   'Bullish',
        confidence:  'High',
        explanation: 'Strong positive sentiment, high attention volume, and a positive price move are all aligned. This combination suggests broad market interest with real momentum behind it.',
      },
      recommendation: {
        action:    'Monitor Closely',
        reasoning: 'Sentiment, attention, and price are all pointing in the same direction. Watch for continuation above recent highs — this is a high-signal environment.',
      },
    };
  }

  // Rule 4 — Moderate bullish: positive sentiment + positive price
  if (isPositive && isPriceUp) {
    return {
      priceOutlook: {
        direction:   'Bullish',
        confidence:  'Medium',
        explanation: 'Positive sentiment and an upward price move suggest building momentum. Attention volume is moderate, which reduces the risk of a hype-driven overreaction.',
      },
      recommendation: {
        action:    'Monitor Closely',
        reasoning: 'Positive sentiment and price movement are aligned. Moderate attention levels suggest this is driven by fundamentals rather than social hype.',
      },
    };
  }

  // Rule 5 — Weak bullish: positive sentiment without price confirmation
  if (isPositive) {
    return {
      priceOutlook: {
        direction:   'Bullish',
        confidence:  'Low',
        explanation: 'Positive sentiment has not yet been confirmed by a meaningful price move. Early optimism without price follow-through reduces conviction in this outlook.',
      },
      recommendation: {
        action:    'Wait for Confirmation',
        reasoning: 'Sentiment is positive but the price hasn\'t followed yet. A price move in the same direction would increase conviction — watch for confirmation before acting.',
      },
    };
  }

  // Rule 6 — Strong bearish: strong negative sentiment + negative price
  if (isStrongNegative && isPriceDown) {
    return {
      priceOutlook: {
        direction:   'Bearish',
        confidence:  'High',
        explanation: 'Strong negative sentiment and a declining price move are aligned. Broad negative coverage at this level frequently precedes further downward pressure.',
      },
      recommendation: {
        action:    'Avoid Chasing',
        reasoning: 'Both sentiment and price are pointing downward with conviction. Avoid adding exposure until signs of stabilisation appear — chasing a falling price in a negative sentiment environment carries high risk.',
      },
    };
  }

  // Rule 7 — Moderate bearish: negative sentiment + negative price
  if (isNegative && isPriceDown) {
    return {
      priceOutlook: {
        direction:   'Bearish',
        confidence:  'Medium',
        explanation: 'Negative sentiment and a declining price move are aligned, suggesting building downward pressure. The signal is not yet strong enough to determine whether this is a short-term dip or a trend change.',
      },
      recommendation: {
        action:    'Caution',
        reasoning: 'Negative sentiment and price movement are moving in the same direction. Wait for sentiment to stabilise or the price to find support before reassessing.',
      },
    };
  }

  // Rule 8 — Weak bearish: negative sentiment without price confirmation
  if (isNegative) {
    return {
      priceOutlook: {
        direction:   'Bearish',
        confidence:  'Low',
        explanation: 'Negative sentiment has not yet been reflected in the price. This gap sometimes resolves upward (sentiment was wrong) or downward (price follows sentiment). Alignment is needed for conviction.',
      },
      recommendation: {
        action:    'Wait for Confirmation',
        reasoning: 'Negative news sentiment hasn\'t matched price action yet — the market may be shrugging it off, or price may follow. Observe the next 24–48 hours for clearer alignment.',
      },
    };
  }

  // Rule 9 — Price–sentiment divergence: neutral sentiment + sharp price drop
  if (isNeutral && isPriceStrongDown) {
    return {
      priceOutlook: {
        direction:   'Bearish',
        confidence:  'Low',
        explanation: 'A notable price decline without clear negative news sentiment is unusual — this may reflect institutional movement or data not yet captured in available coverage.',
      },
      recommendation: {
        action:    'Caution',
        reasoning: 'Today\'s price drop outpaces the sentiment signal. This divergence may resolve quickly — observe whether negative headlines follow or the price recovers before acting.',
      },
    };
  }

  // Rule 10 — Price–sentiment divergence: neutral sentiment + sharp price rise
  if (isNeutral && isPriceStrongUp) {
    return {
      priceOutlook: {
        direction:   'Bullish',
        confidence:  'Low',
        explanation: 'A positive price move without corresponding news sentiment may reflect technical momentum or data not yet captured by available sources.',
      },
      recommendation: {
        action:    'Wait for Confirmation',
        reasoning: 'The price is moving upward but available sentiment data doesn\'t fully explain the move. Wait for supporting news or further price follow-through before drawing conclusions.',
      },
    };
  }

  // Rule 11 — Low signal: low attention + neutral sentiment
  if (isLowAttention && isNeutral) {
    return {
      priceOutlook: {
        direction:   'Neutral',
        confidence:  'Low',
        explanation: 'Very low mention volume and neutral sentiment offer no clear directional signal. Insufficient data to form a view with any confidence.',
      },
      recommendation: {
        action:    'Low Priority',
        reasoning: 'Limited news and social coverage means there\'s not enough signal to draw conclusions. This ticker is not attracting meaningful attention right now.',
      },
    };
  }

  // Rule 12 — Default: neutral sentiment, normal volume, flat price
  return {
    priceOutlook: {
      direction:   'Neutral',
      confidence:  'Medium',
      explanation: 'Sentiment and attention are balanced with no dominant theme. No significant price movement today to support a directional view.',
    },
    recommendation: {
      action:    'Wait for Confirmation',
      reasoning: 'Mixed signals with no clear directional conviction. Monitor for a change in sentiment or a meaningful price move before reassessing.',
    },
  };
}
