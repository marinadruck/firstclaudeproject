'use client';

import { useState } from 'react';
import Link from 'next/link';
import BacktestResults from '@/components/BacktestResults';
import type { BacktestResult } from '@/types';

export default function BacktestPage() {
  const [ticker,      setTicker]      = useState('AAPL');
  const [from,        setFrom]        = useState('2026-04-20');
  const [to,          setTo]          = useState('2026-05-14');
  const [holdingDays, setHoldingDays] = useState('1');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<BacktestResult | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({ from, to, holdingDays });
      const res = await fetch(`/api/backtest/${encodeURIComponent(ticker.toUpperCase())}?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Backtest failed');
      setResult(data as BacktestResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backtest failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="text-lg font-bold text-gray-900 whitespace-nowrap tracking-tight hover:text-blue-600 transition-colors"
          >
            Stock Pulse
          </Link>
          <span className="text-gray-300 select-none">/</span>
          <span className="text-sm font-semibold text-gray-500">Prototype Backtest</span>
        </div>
      </header>

      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
        <p className="max-w-5xl mx-auto text-xs text-amber-700">
          <span className="font-semibold">Sample data</span> — backtest/ML results use a small hand-coded AAPL dataset and are not predictive. Replace with real collected data via the future Phase D pipeline.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
            Prototype Backtest
          </h2>
          <p className="text-sm text-gray-500">
            Runs the recommendation engine on mock training data and scores predictions
            against recorded next-day returns. Mock data only — not a real strategy test.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Parameters
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ticker</label>
              <input
                type="text"
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="AAPL"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
              <p className="text-xs text-gray-400 mt-1">Only AAPL has mock data</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Start date</label>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">End date</label>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Holding period</label>
              <select
                value={holdingDays}
                onChange={e => setHoldingDays(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="1">1 day</option>
                <option value="5">5 days</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={loading || !ticker.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Running…' : 'Run Backtest'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && <BacktestResults result={result} />}
      </div>
    </main>
  );
}
