import type { MLPrediction, OutlookDirection } from '@/types';

const DIR_STYLE: Record<OutlookDirection, string> = {
  Bullish: 'bg-green-100 text-green-700 border-green-200',
  Bearish: 'bg-red-100 text-red-700 border-red-200',
  Neutral: 'bg-gray-100 text-gray-500 border-gray-200',
};

const DIR_ICON: Record<OutlookDirection, string> = {
  Bullish: '▲',
  Bearish: '▼',
  Neutral: '→',
};

function pct(v: number, digits = 2) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}%`;
}

function MetricTile({
  label, value, valueClass = 'text-gray-900', sub,
}: { label: string; value: string; valueClass?: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-extrabold tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function MLPredictionCard({ prediction: p }: { prediction: MLPrediction }) {
  const probPct    = (p.probabilityUp * 100).toFixed(1);
  const probClass  = p.probabilityUp >= 0.6 ? 'text-green-600' : p.probabilityUp <= 0.4 ? 'text-red-600' : 'text-gray-700';
  const barColor   = p.probabilityUp >= 0.6 ? 'bg-green-500' : p.probabilityUp <= 0.4 ? 'bg-red-500' : 'bg-gray-400';

  const maxContrib = Math.max(...p.featureContributions.map(f => Math.abs(f.contribution)), 0.001);

  return (
    <div className="space-y-5">

      {/* Prominent warning */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">
          ⚠ Experimental ML prototype — mock training data only
        </p>
        <p className="text-xs text-amber-700 leading-relaxed">
          This model is trained on <strong>{p.trainingSize} synthetic AAPL records</strong>.
          Results are <strong>not validated</strong>, carry no predictive validity, and must not
          inform any trading or investment decision. This is a code demonstration only.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="bg-gray-100 rounded px-2 py-0.5 font-medium">{p.ticker}</span>
        <span className="bg-gray-100 rounded px-2 py-0.5">Based on snapshot: {p.predictionDate}</span>
        <span className="bg-amber-100 text-amber-700 rounded px-2 py-0.5 font-medium">Mock data</span>
      </div>

      {/* Probability bar + direction */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          ML Prediction
        </p>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${DIR_STYLE[p.predictedDirection]}`}>
            {DIR_ICON[p.predictedDirection]} {p.predictedDirection}
          </span>
          <span className="text-sm text-gray-500">Confidence: <span className="font-semibold text-gray-700">{p.confidence}</span></span>
          <span className={`text-2xl font-extrabold tabular-nums ${probClass}`}>{probPct}% P(up)</span>
        </div>
        {/* Probability bar */}
        <div className="mb-1">
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${p.probabilityUp * 100}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0% (Bearish)</span>
            <span>40%–60% (Neutral zone)</span>
            <span>100% (Bullish)</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricTile
          label="Probability Up"
          value={`${probPct}%`}
          valueClass={probClass}
        />
        <MetricTile
          label="Predicted Direction"
          value={p.predictedDirection}
          valueClass={p.predictedDirection === 'Bullish' ? 'text-green-600' : p.predictedDirection === 'Bearish' ? 'text-red-600' : 'text-gray-700'}
        />
        <MetricTile
          label="Expected Return"
          value={pct(p.expectedReturnPct)}
          valueClass={p.expectedReturnPct >= 0 ? 'text-green-600' : 'text-red-600'}
          sub="k-NN estimate (mock)"
        />
        <MetricTile
          label="Training Records"
          value={String(p.trainingSize)}
          sub="AAPL mock data"
        />
      </div>

      {/* Feature contributions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Why this prediction?
        </p>
        <div className="space-y-3">
          {p.featureContributions.map(f => (
            <div key={f.name} className="flex items-center gap-3">
              <span className="w-36 text-sm text-gray-600 shrink-0">{f.name}</span>
              <span className="w-14 text-xs text-gray-400 text-right tabular-nums shrink-0">
                {f.value.toFixed(3)}
              </span>
              {/* Split bar */}
              <div className="flex flex-1 items-center h-4">
                {/* Left (negative) */}
                <div className="flex-1 flex justify-end pr-px">
                  {f.contribution < 0 && (
                    <div
                      className="h-2 bg-red-400 rounded-l"
                      style={{ width: `${(Math.abs(f.contribution) / maxContrib) * 100}%` }}
                    />
                  )}
                </div>
                <div className="w-px h-4 bg-gray-200 shrink-0" />
                {/* Right (positive) */}
                <div className="flex-1 flex justify-start pl-px">
                  {f.contribution > 0 && (
                    <div
                      className="h-2 bg-green-400 rounded-r"
                      style={{ width: `${(Math.abs(f.contribution) / maxContrib) * 100}%` }}
                    />
                  )}
                </div>
              </div>
              <span className={`w-14 text-xs text-right tabular-nums shrink-0 ${f.contribution > 0 ? 'text-green-600' : f.contribution < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {f.contribution > 0 ? '+' : ''}{f.contribution.toFixed(3)}
              </span>
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-1">
            Green bars push toward Bullish · Red bars push toward Bearish
          </p>
        </div>
      </div>

      {/* Rule-based comparison */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          ML vs Rule Engine (same snapshot)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">ML Model</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${DIR_STYLE[p.predictedDirection]}`}>
              {DIR_ICON[p.predictedDirection]} {p.predictedDirection}
            </span>
            <p className="text-xs text-gray-500 mt-2">P(up): {probPct}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Rule Engine</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${DIR_STYLE[p.ruleBasedDirection]}`}>
              {DIR_ICON[p.ruleBasedDirection]} {p.ruleBasedDirection}
            </span>
            <p className="text-xs text-gray-500 mt-2">Action: {p.ruleBasedAction}</p>
          </div>
        </div>
      </div>

      {/* Model explanation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Model Explanation
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">{p.modelExplanation}</p>
      </div>

      <p className="text-xs text-gray-400 text-center pb-2">
        ⚠ Experimental ML prototype only. Not financial advice.
      </p>
    </div>
  );
}
