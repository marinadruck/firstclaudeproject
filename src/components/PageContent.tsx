'use client';
import { useCallback } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import WatchlistBar from './WatchlistBar';
import Dashboard from './Dashboard';

export default function PageContent({ ticker }: { ticker: string | undefined }) {
  const { watchlist, add, remove, isInWatchlist } = useWatchlist();

  const handleToggleWatchlist = useCallback(
    (entry: { ticker: string; companyName: string }) => {
      if (isInWatchlist(entry.ticker)) {
        remove(entry.ticker);
      } else {
        add(entry);
      }
    },
    [isInWatchlist, add, remove],
  );

  return (
    <>
      {watchlist.length > 0 && (
        <WatchlistBar
          watchlist={watchlist}
          activeTicker={ticker}
          onRemove={remove}
        />
      )}

      {ticker ? (
        <Dashboard
          ticker={ticker}
          isSaved={isInWatchlist(ticker)}
          onToggleWatchlist={handleToggleWatchlist}
        />
      ) : (
        <div className="text-center py-28">
          <p className="text-3xl font-bold text-gray-800 mb-3">
            Track stock attention &amp; sentiment
          </p>
          <p className="text-gray-500 mb-2">
            Enter a ticker symbol to see mention volume, sentiment, price history, and recent headlines.
          </p>
          <p className="text-sm text-gray-400">Try: AAPL · AMZN · GOOG · MSFT · TSLA</p>
        </div>
      )}
    </>
  );
}
