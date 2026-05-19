'use client';

import { useEffect, useState } from 'react';
import type { StockData } from '@/types';
import MetricCard from './MetricCard';
import SignalBadge from './SignalBadge';
import PriceChart from './PriceChart';
import HeadlineList from './HeadlineList';

export default function Dashboard({ ticker }: { ticker: string }) {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/stock/${encodeURIComponent(ticker)}`)
      .then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e.error ?? 'Not found'));
        return res.json() as Promise<StockData>;
      })
      .then(setData)
      .catch((err: unknown) =>
        setError(typeof err === 'string' ? err : 'Failed to load data'),
      )
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) return <Skeleton />;

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-red-500 mb-2">{error ?? 'Ticker not found'}</p>
        <p className="text-sm text-gray-400">Available tickers: AAPL · TSLA · NVDA · MSFT · GME</p>
      </div>
    );
  }

  const sentimentPct = Math.round(data.sentimentScore * 100);
  const sentimentClass =
    data.sentimentScore > 0.1
      ? 'text-green-600'
      : data.sentimentScore < -0.1
        ? 'text-red-600'
        : 'text-gray-700';

  const priceChangeClass = data.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600';
  const priceChangePrefix = data.priceChangePercent >= 0 ? '+' : '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              {data.ticker}
            </h2>
            <SignalBadge signal={data.signal} />
          </div>
          <p className="text-gray-500 mt-1">{data.companyName}</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-extrabold text-gray-900 tabular-nums">
            ${data.currentPrice.toFixed(2)}
          </p>
          <p className={`text-sm font-semibold mt-0.5 tabular-nums ${priceChangeClass}`}>
            {priceChangePrefix}
            {data.priceChangePercent.toFixed(2)}% today
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          label="Mentions (24 h)"
          value={data.mentionCount.toLocaleString()}
          subtitle="Across news & social media"
        />
        <MetricCard
          label="Sentiment Score"
          value={sentimentPct > 0 ? `+${sentimentPct}` : String(sentimentPct)}
          valueClassName={sentimentClass}
          subtitle="−100 very bearish · +100 very bullish"
        />
      </div>

      {/* Price chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Price History — 30 Days
        </p>
        <PriceChart data={data.priceHistory} />
      </div>

      {/* Headlines */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Recent Headlines & Mentions
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
      <div className="h-72 bg-gray-200 rounded-xl" />
      <div className="h-56 bg-gray-200 rounded-xl" />
    </div>
  );
}
