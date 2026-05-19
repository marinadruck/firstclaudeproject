import type { BacktestResult, OutlookDirection } from '@/types';

const DIR_STYLE: Record<OutlookDirection, string> = {
  Bullish: 'bg-green-100 text-green-700',
  Bearish: 'bg-red-100 text-red-700',
  Neutral: 'bg-gray-100 text-gray-500',
};

function pct(v: number, digits = 2) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}%`;
}

function MetricTile({
  label,
  value,
  valueClass = 'text-gray-900',
  sub,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function BacktestResults({ result }: { result: BacktestResult }) {
  const { metrics, trades } = result;
  const winRatePct = (metrics.winRate * 100).toFixed(1);
  const winRateClass = metrics.winRate >= 0.55 ? 'text-green-600' : 'text-gray-700';

  return (
    <div className="space-y-5">
      {/* Prominent mock-data warning */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">
          ⚠ Prototype backtest — mock data only
        </p>
        <p className="text-xs text-amber-700 leading-relaxed">
          This backtest runs the recommendation engine against synthetic training data,
          not real historical prices or sentiment. Results <strong>do not validate the live
          strategy</strong> and must not inform any trading or investment decisions.
          Connect real historical data to perform a meaningful backtest.
        </p>
      </div>

      {/* Summary line */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="bg-gray-100 rounded px-2 py-0.5 font-medium">{result.ticker}</span>
        <span className="bg-gray-100 rounded px-2 py-0.5">{result.from} → {result.to}</span>
        <span className="bg-gray-100 rounded px-2 py-0.5">{result.holdingDays}-day holding</span>
        <span className="bg-amber-100 text-amber-700 rounded px-2 py-0.5 font-medium">Mock data</span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricTile
          label="Total Signals"
          value={String(metrics.totalSignals)}
          sub={`${metrics.directionalSignals} directional`}
        />
        <MetricTile
          label="Win Rate"
          value={`${winRatePct}%`}
          valueClass={winRateClass}
          sub={`${metrics.wins} / ${metrics.directionalSignals} directional`}
        />
        <MetricTile
          label="Avg Return"
          value={pct(metrics.avgReturn)}
          valueClass={metrics.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'}
          sub="per holding period"
        />
        <MetricTile
          label="Max Drawdown"
          value={`-${metrics.maxDrawdown.toFixed(2)}%`}
          valueClass="text-red-600"
          sub="equity curve"
        />
      </div>

      {/* Best / worst */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Best Trade</p>
          <p className="text-lg font-bold text-green-600 tabular-nums">{pct(metrics.bestTrade)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Worst Trade</p>
          <p className="text-lg font-bold text-red-600 tabular-nums">{pct(metrics.worstTrade)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Avg Bullish Return</p>
          <p className="text-lg font-bold tabular-nums">{pct(metrics.avgBullishReturn)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Avg Bearish Return</p>
          <p className="text-lg font-bold tabular-nums">{pct(metrics.avgBearishReturn)}</p>
        </div>
      </div>

      {/* Trade table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Simulated Trades
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="pb-2 pr-4 font-semibold">Date</th>
                <th className="pb-2 pr-4 font-semibold">Prediction</th>
                <th className="pb-2 pr-4 font-semibold">Conf</th>
                <th className="pb-2 pr-4 font-semibold">Action</th>
                <th className="pb-2 pr-4 font-semibold text-right">Fwd Return</th>
                <th className="pb-2 pr-4 font-semibold">Actual</th>
                <th className="pb-2 font-semibold text-center">W/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {trades.map(t => (
                <tr key={t.date} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 pr-4 text-gray-500 tabular-nums">{t.date}</td>
                  <td className="py-2 pr-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${DIR_STYLE[t.direction]}`}>
                      {t.direction}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-500">{t.confidence}</td>
                  <td className="py-2 pr-4 text-gray-600">{t.action}</td>
                  <td className={`py-2 pr-4 text-right tabular-nums font-medium ${t.forwardReturnPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {pct(t.forwardReturnPct)}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${DIR_STYLE[t.actualOutcome]}`}>
                      {t.actualOutcome}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    {t.direction === 'Neutral'
                      ? <span className="text-gray-300">—</span>
                      : t.isWin
                        ? <span className="text-green-600 font-bold">W</span>
                        : <span className="text-red-500 font-bold">L</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
