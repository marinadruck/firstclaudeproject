import type { Signal } from '@/types';

const STYLES: Record<Signal, string> = {
  'High Attention': 'bg-amber-100 text-amber-800 border-amber-200',
  Watch: 'bg-blue-100 text-blue-800 border-blue-200',
  'Low Attention': 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function SignalBadge({ signal }: { signal: Signal }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${STYLES[signal]}`}
    >
      {signal}
    </span>
  );
}
