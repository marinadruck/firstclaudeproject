import type { Signal } from '@/types';

const HIGH_ATTENTION_THRESHOLD = 100;
const LOW_ATTENTION_THRESHOLD = 20;

export function computeSignal(mentionCount: number, _sentimentScore: number): Signal {
  if (mentionCount >= HIGH_ATTENTION_THRESHOLD) return 'High Attention';
  if (mentionCount <= LOW_ATTENTION_THRESHOLD) return 'Low Attention';
  return 'Watch';
}
