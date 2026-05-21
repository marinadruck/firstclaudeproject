'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StockData } from '@/types';
import { usePolling } from '@/hooks/usePolling';
import MetricCard from './MetricCard';
import SignalBadge from './SignalBadge';
import PriceChart from './PriceChart';
import HeadlineList from './HeadlineList';
import SentimentInsightCard from './SentimentInsightCard';
import OutlookCard from './OutlookCard';

const POLL_INTERVAL_MS = 45_000;

interface Props {
  ticker: string;
  isSaved: boolean;
  onToggleWatchlist: (entry: { ticker: string; companyName: string }) => void;
}

export default function Dashboard({ ticker, isSaved, onToggleWatchlist }: Props) {
  const [data, setData]             = useState<StockData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const doFetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(ticker)}`);
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error ?? 'Not found');
      }
      setData(await res.json());
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  }, [ticker]);

  // Full reset + initial load on ticker change
  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    setLastUpdated(null);
    doFetch().finally(() => setLoading(false));
  }, [ticker, doFetch]);

  // Silent background polling (no loading spinner on refresh)
  usePolling(doFetch, POLL_INTERVAL_MS);

  // "Updated Xs ago" counter — resets every time a fetch succeeds
  useEffect(() => {
    if (!lastUpdated) return;
    setSecondsAgo(0);
    const id = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  if (loading) return <Skeleton />;

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-red-500 mb-2">{error ?? 'Ticker not found'}</p>
        <p className="text-sm text-gray-400">Enter any US stock ticker (e.g. AAPL, AMZN, GOOG)</p>
      </div>
    );
  }

  const sentimentPct   = Math.round(data.sentimentScore * 100);
  const sentimentClass =
    data.sentimentScore > 0.1  ? 'text-green-600'
    : data.sentimentScore < -0.1 ? 'text-red-600'
    : 'text-gray-700';

  const priceChangeClass  = data.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600';
  const priceChangePrefix = data.priceChangePercent >= 0 ? '+' : '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">{data.ticker}</h2>
            <SignalBadge signal={data.signal} />
            <button
              onClick={() => onToggleWatchlist({ ticker: data.ticker, companyName: data.companyName })}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium transition-colors ${
                isSaved
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span>{isSaved ? '★' : '☆'}</span>
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
          <p className="text-gray-500 mt-1">{data.companyName}</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-extrabold text-gray-900 tabular-nums">
            ${data.currentPrice.toFixed(2)}
          </p>
          <p className={`text-sm font-semibold mt-0.5 tabular-nums ${priceChangeClass}`}>
            {priceChangePrefix}{data.priceChangePercent.toFixed(2)}% today
          </p>
        </div>
      </div>

      {/* Metric cards + live indicator */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            label="Mentions (24 h)"
            value={data.mentionCount.toLocaleString()}
            subtitle={`News: ${data.newsMentionCount} · Reddit: ${data.redditMentionCount}`}
          />
          <MetricCard
            label="Sentiment Score"
            value={sentimentPct > 0 ? `+${sentimentPct}` : String(sentimentPct)}
            valueClassName={sentimentClass}
            subtitle="−100 very bearish · +100 very bullish"
          />
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1.5 mt-2 ml-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-gray-400">
              Simulated live · updated {secondsAgo}s ago
            </span>
          </div>
        )}
      </div>

      {/* Sentiment analysis */}
      <SentimentInsightCard
        explanation={data.sentimentExplanation}
        advancedSentiment={data.advancedSentiment}
      />

      {/* Price chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Price History — 30 Days
        </p>
        <PriceChart data={data.priceHistory} />
        {data.priceHistory.length > 0 && (
          <p className="text-xs text-gray-400 mt-2 text-right">Source: Alpha Vantage</p>
        )}
      </div>

      {/* Outlook + recommendation */}
      <OutlookCard outlook={data.priceOutlook} recommendation={data.recommendation} />

      {/* Headlines */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Recent Headlines &amp; Mentions
        </p>
        <HeadlineList headlines={data.headlines} />
      </div>

      <p className="text-xs text-gray-400 text-center pb-4">
        For informational purposes only. Not financial advice.
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <div className="h-10 w-28 bg-gray-200 rounded-lg" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-10 w-36 bg-gray-200 rounded-lg ml-auto" />
          <div className="h-4 w-24 bg-gray-200 rounded ml-auto" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-28 bg-gray-200 rounded-xl" />
        <div className="h-28 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="h-72 bg-gray-200 rounded-xl" />
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="h-56 bg-gray-200 rounded-xl" />
    </div>
  );
}
