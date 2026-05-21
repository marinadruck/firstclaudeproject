'use client';

import { useState } from 'react';
import Link from 'next/link';
import MLPredictionCard from '@/components/MLPredictionCard';
import type { MLPrediction } from '@/types';

export default function MLPage() {
  const [ticker,  setTicker]  = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<MLPrediction | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res  = await fetch(`/api/ml/${encodeURIComponent(ticker.toUpperCase())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Prediction failed');
      setResult(data as MLPrediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
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
          <span className="text-sm font-semibold text-gray-500">Experimental ML Prototype</span>
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
            Experimental ML Prototype
          </h2>
          <p className="text-sm text-gray-500">
            Logistic regression trained on mock training data. Not a real trading model —
            for code demonstration purposes only.
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
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ticker</label>
              <input
                type="text"
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="AAPL"
                className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
              <p className="text-xs text-gray-400 mt-1">Only AAPL has mock data</p>
            </div>
            <button
              type="submit"
              disabled={loading || !ticker.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Running…' : 'Run Prediction'}
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
        {result && <MLPredictionCard prediction={result} />}
      </div>
    </main>
  );
}
