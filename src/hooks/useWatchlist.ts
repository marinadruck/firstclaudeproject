'use client';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'stockpulse_watchlist';

export interface WatchlistEntry {
  ticker: string;
  companyName: string;
}

function persist(entries: WatchlistEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch {}
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWatchlist(JSON.parse(raw) as WatchlistEntry[]);
    } catch {}
  }, []);

  const add = useCallback((entry: WatchlistEntry) => {
    setWatchlist(prev => {
      if (prev.some(e => e.ticker === entry.ticker)) return prev;
      const next = [...prev, entry];
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((ticker: string) => {
    setWatchlist(prev => {
      const next = prev.filter(e => e.ticker !== ticker);
      persist(next);
      return next;
    });
  }, []);

  const isInWatchlist = useCallback(
    (ticker: string) => watchlist.some(e => e.ticker === ticker),
    [watchlist],
  );

  return { watchlist, add, remove, isInWatchlist };
}
