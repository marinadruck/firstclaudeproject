/*
 * Advanced local sentiment analysis for financial text.
 *
 * Smarter than simple keyword counting: handles negation, intensity modifiers,
 * and domain-specific phrase categories (earnings, analyst, regulatory, litigation).
 *
 * LLM-READY ARCHITECTURE
 * The AdvancedSentimentResult interface mirrors what a real NLP model returns.
 * To upgrade to FinBERT, OpenAI, or a Hugging Face model, replace the body of
 * `scoreAdvancedSentiment` with an async call to that API — the return type is
 * identical so callers need no changes.
 */

import type {
  AdvancedSentimentResult,
  AdvancedSentimentSummary,
  ConfidenceLevel,
} from '@/types';

// ─── SCORING RULES ────────────────────────────────────────────────────────────

interface ScoringRule {
  pattern: string;
  score: number;
  category: string;
  label: string;
}

// Phrases are matched before single words; replaced in working text to prevent
// double-counting individual tokens that are part of a multi-word signal.
const PHRASES: ScoringRule[] = [
  // Earnings
  { pattern: 'beats earnings expectations', score:  0.55, category: 'earnings',   label: 'Beat earnings expectations'   },
  { pattern: 'misses earnings expectations', score: -0.55, category: 'earnings',   label: 'Missed earnings expectations' },
  { pattern: 'beats earnings',               score:  0.45, category: 'earnings',   label: 'Beat earnings'                },
  { pattern: 'misses earnings',              score: -0.45, category: 'earnings',   label: 'Missed earnings'              },
  { pattern: 'beats estimates',              score:  0.40, category: 'earnings',   label: 'Beat analyst estimates'       },
  { pattern: 'misses estimates',             score: -0.40, category: 'earnings',   label: 'Missed analyst estimates'     },
  { pattern: 'above estimates',              score:  0.35, category: 'earnings',   label: 'Results above estimates'      },
  { pattern: 'below estimates',              score: -0.35, category: 'earnings',   label: 'Results below estimates'      },
  { pattern: 'raises guidance',              score:  0.40, category: 'earnings',   label: 'Guidance raised'              },
  { pattern: 'raises full year',             score:  0.35, category: 'earnings',   label: 'Full-year outlook raised'     },
  { pattern: 'cuts guidance',                score: -0.45, category: 'earnings',   label: 'Guidance cut'                 },
  { pattern: 'lowers guidance',              score: -0.40, category: 'earnings',   label: 'Guidance lowered'             },
  { pattern: 'record revenue',               score:  0.40, category: 'earnings',   label: 'Record revenue'               },
  { pattern: 'revenue growth',               score:  0.25, category: 'earnings',   label: 'Revenue growth'               },
  { pattern: 'revenue decline',              score: -0.30, category: 'earnings',   label: 'Revenue decline'              },
  { pattern: 'margin expansion',             score:  0.30, category: 'earnings',   label: 'Margin expansion'             },
  { pattern: 'margin compression',           score: -0.30, category: 'earnings',   label: 'Margin compression'           },
  // Analyst
  { pattern: 'upgraded to buy',              score:  0.50, category: 'analyst',    label: 'Upgraded to Buy'              },
  { pattern: 'upgrade to buy',               score:  0.50, category: 'analyst',    label: 'Upgraded to Buy'              },
  { pattern: 'downgraded to sell',           score: -0.50, category: 'analyst',    label: 'Downgraded to Sell'           },
  { pattern: 'downgrade to sell',            score: -0.50, category: 'analyst',    label: 'Downgraded to Sell'           },
  { pattern: 'analyst upgrade',              score:  0.40, category: 'analyst',    label: 'Analyst upgrade'              },
  { pattern: 'analyst downgrade',            score: -0.40, category: 'analyst',    label: 'Analyst downgrade'            },
  { pattern: 'price target raised',          score:  0.35, category: 'analyst',    label: 'Price target raised'          },
  { pattern: 'raised price target',          score:  0.35, category: 'analyst',    label: 'Price target raised'          },
  { pattern: 'price target cut',             score: -0.35, category: 'analyst',    label: 'Price target cut'             },
  { pattern: 'price target lowered',         score: -0.35, category: 'analyst',    label: 'Price target lowered'         },
  { pattern: 'outperform rating',            score:  0.30, category: 'analyst',    label: 'Outperform rating'            },
  { pattern: 'buy rating',                   score:  0.30, category: 'analyst',    label: 'Buy rating'                   },
  { pattern: 'sell rating',                  score: -0.30, category: 'analyst',    label: 'Sell rating'                  },
  // Litigation / Regulatory
  { pattern: 'sec investigation',            score: -0.55, category: 'regulatory', label: 'SEC investigation'            },
  { pattern: 'doj investigation',            score: -0.55, category: 'regulatory', label: 'DOJ investigation'            },
  { pattern: 'class action',                 score: -0.45, category: 'litigation', label: 'Class action lawsuit'         },
  { pattern: 'antitrust investigation',      score: -0.50, category: 'regulatory', label: 'Antitrust investigation'      },
  { pattern: 'regulatory fine',              score: -0.40, category: 'regulatory', label: 'Regulatory fine'              },
  { pattern: 'data breach',                  score: -0.40, category: 'regulatory', label: 'Data breach'                  },
  { pattern: 'consent decree',               score: -0.35, category: 'regulatory', label: 'Consent decree'               },
  { pattern: 'faces charges',                score: -0.40, category: 'litigation', label: 'Faces charges'                },
  { pattern: 'whistleblower complaint',      score: -0.35, category: 'regulatory', label: 'Whistleblower complaint'      },
  // Corporate events
  { pattern: 'share buyback',                score:  0.30, category: 'corporate',  label: 'Share buyback'                },
  { pattern: 'stock buyback',                score:  0.30, category: 'corporate',  label: 'Stock buyback'                },
  { pattern: 'dividend increase',            score:  0.30, category: 'corporate',  label: 'Dividend increase'            },
  { pattern: 'raises dividend',              score:  0.30, category: 'corporate',  label: 'Dividend raised'              },
  { pattern: 'strategic partnership',        score:  0.25, category: 'corporate',  label: 'Strategic partnership'        },
  // Price context
  { pattern: 'all time high',                score:  0.40, category: 'price',      label: 'All-time high'                },
  { pattern: '52 week high',                 score:  0.35, category: 'price',      label: '52-week high'                 },
  { pattern: '52 week low',                  score: -0.35, category: 'price',      label: '52-week low'                  },
];

// Sorted longest-first so "beats earnings expectations" is tried before "beats earnings"
const SORTED_PHRASES = [...PHRASES].sort((a, b) => b.pattern.length - a.pattern.length);

const SINGLE_WORDS: ScoringRule[] = [
  { pattern: 'beat',          score:  0.30, category: 'earnings',   label: 'Beat'              },
  { pattern: 'beats',         score:  0.30, category: 'earnings',   label: 'Beat'              },
  { pattern: 'surge',         score:  0.30, category: 'price',      label: 'Surged'            },
  { pattern: 'surged',        score:  0.30, category: 'price',      label: 'Surged'            },
  { pattern: 'rally',         score:  0.25, category: 'price',      label: 'Rallied'           },
  { pattern: 'rallied',       score:  0.25, category: 'price',      label: 'Rallied'           },
  { pattern: 'upgrade',       score:  0.30, category: 'analyst',    label: 'Upgrade'           },
  { pattern: 'upgraded',      score:  0.30, category: 'analyst',    label: 'Upgraded'          },
  { pattern: 'outperform',    score:  0.25, category: 'analyst',    label: 'Outperform'        },
  { pattern: 'growth',        score:  0.20, category: 'earnings',   label: 'Growth'            },
  { pattern: 'profit',        score:  0.20, category: 'earnings',   label: 'Profit'            },
  { pattern: 'profitable',    score:  0.25, category: 'earnings',   label: 'Profitable'        },
  { pattern: 'breakthrough',  score:  0.30, category: 'corporate',  label: 'Breakthrough'      },
  { pattern: 'approved',      score:  0.25, category: 'regulatory', label: 'Approved'          },
  { pattern: 'soared',        score:  0.30, category: 'price',      label: 'Soared'            },
  { pattern: 'record',        score:  0.20, category: 'earnings',   label: 'Record'            },
  { pattern: 'bullish',       score:  0.25, category: 'general',    label: 'Bullish sentiment' },
  { pattern: 'boom',          score:  0.25, category: 'general',    label: 'Boom'              },
  { pattern: 'miss',          score: -0.30, category: 'earnings',   label: 'Miss'              },
  { pattern: 'misses',        score: -0.30, category: 'earnings',   label: 'Miss'              },
  { pattern: 'missed',        score: -0.30, category: 'earnings',   label: 'Missed'            },
  { pattern: 'decline',       score: -0.25, category: 'general',    label: 'Decline'           },
  { pattern: 'declined',      score: -0.25, category: 'general',    label: 'Declined'          },
  { pattern: 'dropped',       score: -0.25, category: 'price',      label: 'Dropped'           },
  { pattern: 'fell',          score: -0.20, category: 'price',      label: 'Fell'              },
  { pattern: 'loss',          score: -0.25, category: 'earnings',   label: 'Loss'              },
  { pattern: 'losses',        score: -0.25, category: 'earnings',   label: 'Losses'            },
  { pattern: 'downgrade',     score: -0.30, category: 'analyst',    label: 'Downgrade'         },
  { pattern: 'downgraded',    score: -0.30, category: 'analyst',    label: 'Downgraded'        },
  { pattern: 'underperform',  score: -0.25, category: 'analyst',    label: 'Underperform'      },
  { pattern: 'weak',          score: -0.20, category: 'general',    label: 'Weak'              },
  { pattern: 'lawsuit',       score: -0.35, category: 'litigation', label: 'Lawsuit'           },
  { pattern: 'investigation', score: -0.35, category: 'regulatory', label: 'Under investigation'},
  { pattern: 'recall',        score: -0.30, category: 'corporate',  label: 'Product recall'    },
  { pattern: 'bearish',       score: -0.25, category: 'general',    label: 'Bearish sentiment' },
  { pattern: 'crash',         score: -0.35, category: 'price',      label: 'Crash'             },
  { pattern: 'crashed',       score: -0.35, category: 'price',      label: 'Crashed'           },
  { pattern: 'fraud',         score: -0.45, category: 'regulatory', label: 'Fraud allegation'  },
  { pattern: 'scandal',       score: -0.40, category: 'regulatory', label: 'Scandal'           },
  { pattern: 'layoffs',       score: -0.25, category: 'corporate',  label: 'Layoffs'           },
  { pattern: 'layoff',        score: -0.25, category: 'corporate',  label: 'Layoff'            },
  { pattern: 'disappoints',   score: -0.30, category: 'earnings',   label: 'Disappoints'       },
  { pattern: 'plunged',       score: -0.35, category: 'price',      label: 'Plunged'           },
  { pattern: 'plunge',        score: -0.30, category: 'price',      label: 'Plunge'            },
  { pattern: 'slump',         score: -0.25, category: 'price',      label: 'Slump'             },
  { pattern: 'penalty',       score: -0.30, category: 'regulatory', label: 'Penalty'           },
  { pattern: 'bankruptcy',    score: -0.55, category: 'corporate',  label: 'Bankruptcy'        },
  { pattern: 'fine',          score: -0.20, category: 'regulatory', label: 'Regulatory fine'   },
  { pattern: 'warning',       score: -0.20, category: 'general',    label: 'Warning issued'    },
  { pattern: 'risk',          score: -0.15, category: 'general',    label: 'Risk flagged'      },
  { pattern: 'headwinds',     score: -0.20, category: 'general',    label: 'Headwinds'         },
  { pattern: 'uncertainty',   score: -0.15, category: 'general',    label: 'Uncertainty'       },
];

const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'without', "n't", 'fail', 'fails', 'failed',
  'unable', 'unlikely', 'despite',
]);

const INTENSITY: Record<string, number> = {
  significantly: 1.8, sharply: 1.7, massively: 1.8, dramatically: 1.8,
  strongly: 1.6,  hugely: 1.7, substantially: 1.5, considerably: 1.5,
  notably: 1.4,   very: 1.3,   highly: 1.3,
  slightly: 0.5,  marginally: 0.5, somewhat: 0.6, modestly: 0.6, narrowly: 0.6,
};

// ─── SINGLE-HEADLINE SCORER ───────────────────────────────────────────────────

export function scoreAdvancedSentiment(text: string): AdvancedSentimentResult {
  // Phrase-first: replace matched phrases in working text so their tokens are
  // not also scored by the single-word loop below.
  let workingText = text.toLowerCase();
  let totalScore  = 0;
  const reasons: string[] = [];

  for (const rule of SORTED_PHRASES) {
    if (!workingText.includes(rule.pattern)) continue;

    const idx = workingText.indexOf(rule.pattern);
    const before = workingText.slice(Math.max(0, idx - 50), idx).split(/\W+/).filter(Boolean).slice(-5);
    const isNegated  = before.some(t => NEGATION_WORDS.has(t));
    const intensityW = before.slice(-2).find(t => t in INTENSITY);
    const multiplier = intensityW ? INTENSITY[intensityW] : 1.0;

    const finalScore = rule.score * multiplier * (isNegated ? -0.7 : 1.0);
    totalScore += finalScore;
    const suffix = intensityW ? ` (${intensityW})` : '';
    reasons.push(isNegated ? `Negated: ${rule.label}${suffix}` : `${rule.label}${suffix}`);

    workingText = workingText.replace(rule.pattern, ' ');
  }

  // Single-word scan with negation and intensity state machines
  const tokens = workingText.split(/\W+/).filter(Boolean);
  let negated   = false;
  let negCount  = 0;
  let intMul    = 1.0;
  let intCount  = 0;

  for (const token of tokens) {
    if (NEGATION_WORDS.has(token)) { negated = true; negCount = 3; }
    else if (negCount > 0) { if (--negCount === 0) negated = false; }

    if (token in INTENSITY) { intMul = INTENSITY[token]; intCount = 2; }
    else if (intCount > 0) { if (--intCount === 0) intMul = 1.0; }

    const rule = SINGLE_WORDS.find(r => r.pattern === token);
    if (!rule) continue;

    const finalScore = rule.score * intMul * (negated ? -0.6 : 1.0);
    totalScore += finalScore;
    if (Math.abs(finalScore) >= 0.10) {
      reasons.push(negated ? `Negated: ${rule.label}` : rule.label);
    }
  }

  const score = Math.round(Math.max(-1, Math.min(1, totalScore)) * 1000) / 1000;
  const label: AdvancedSentimentResult['label'] =
    score > 0.1 ? 'Positive' : score < -0.1 ? 'Negative' : 'Neutral';

  const magnitude = Math.abs(score);
  const confidence: ConfidenceLevel =
    reasons.length >= 2 && magnitude >= 0.35 ? 'High'   :
    reasons.length >= 1 && magnitude >= 0.12 ? 'Medium' : 'Low';

  const top = reasons[0] ?? 'No strong financial signals found';
  const dirWord = label.toLowerCase();
  const explanation =
    `${label} (${(score * 100).toFixed(0)}%) — ${top}` +
    (reasons.length > 1 ? ` and ${reasons.length - 1} other signal${reasons.length > 2 ? 's' : ''}.` : '.');

  return { label, score, confidence, explanation, reasons: reasons.slice(0, 5), method: 'advanced-local' };
}

// ─── AGGREGATE ACROSS HEADLINES ───────────────────────────────────────────────

export function aggregateAdvancedSentiment(
  texts: string[],
  basicScore: number,
): AdvancedSentimentSummary {
  if (texts.length === 0) {
    return {
      score: basicScore, basicScore,
      label: basicScore > 0.1 ? 'Positive' : basicScore < -0.1 ? 'Negative' : 'Neutral',
      confidence: 'Low', method: 'advanced-local', topReasons: [],
    };
  }

  const results    = texts.map(scoreAdvancedSentiment);
  const avgRaw     = results.reduce((s, r) => s + r.score, 0) / results.length;
  const score      = Math.round(Math.max(-1, Math.min(1, avgRaw)) * 1000) / 1000;
  const label: AdvancedSentimentSummary['label'] =
    score > 0.1 ? 'Positive' : score < -0.1 ? 'Negative' : 'Neutral';

  const highCount   = results.filter(r => r.confidence === 'High').length;
  const medCount    = results.filter(r => r.confidence === 'Medium').length;
  const confidence: ConfidenceLevel =
    highCount   > results.length * 0.3                 ? 'High'   :
    highCount + medCount > results.length * 0.25        ? 'Medium' : 'Low';

  // Count reason frequency across all headlines, show top 4
  const counts = new Map<string, number>();
  for (const r of results) {
    for (const reason of r.reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  const topReasons = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([reason, n]) => n > 1 ? `${reason} (×${n})` : reason);

  return { score, basicScore, label, confidence, method: 'advanced-local', topReasons };
}
