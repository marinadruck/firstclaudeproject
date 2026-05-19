'use client';
import { useRouter } from 'next/navigation';
import type { WatchlistEntry } from '@/hooks/useWatchlist';

interface Props {
  watchlist: WatchlistEntry[];
  activeTicker: string | undefined;
  onRemove: (ticker: string) => void;
}

export default function WatchlistBar({ watchlist, activeTicker, onRemove }: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 overflow-x-auto mb-5 pb-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap shrink-0">
        Watchlist
      </span>
      {watchlist.map(entry => {
        const isActive = entry.ticker === activeTicker;
        return (
          <div
            key={entry.ticker}
            className={`flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full border text-sm whitespace-nowrap shrink-0 transition-colors ${
              isActive
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <button
              onClick={() => router.push(`/?ticker=${encodeURIComponent(entry.ticker)}`)}
              className="font-semibold leading-none"
            >
              {entry.ticker}
            </button>
            <span className="text-xs text-gray-400 hidden sm:inline mx-0.5">
              {entry.companyName.split(' ')[0]}
            </span>
            <button
              onClick={() => onRemove(entry.ticker)}
              className="w-4 h-4 ml-0.5 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xs"
              aria-label={`Remove ${entry.ticker} from watchlist`}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
