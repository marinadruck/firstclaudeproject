import type { PriceOutlook, DecisionRecommendation, OutlookDirection } from '@/types';

const DIRECTION_STYLES: Record<OutlookDirection, string> = {
  Bullish: 'bg-green-100 text-green-700 border-green-200',
  Neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  Bearish: 'bg-red-100 text-red-700 border-red-200',
};

const DIRECTION_ICONS: Record<OutlookDirection, string> = {
  Bullish: '▲',
  Neutral: '→',
  Bearish: '▼',
};

interface Props {
  outlook: PriceOutlook;
  recommendation: DecisionRecommendation;
}

export default function OutlookCard({ outlook, recommendation }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Outlook &amp; Decision Support
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Next-Day Outlook</p>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${DIRECTION_STYLES[outlook.direction]}`}
            >
              {DIRECTION_ICONS[outlook.direction]} {outlook.direction}
            </span>
            <span className="text-xs text-gray-400">Confidence: {outlook.confidence}</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{outlook.explanation}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Decision Support</p>
          <p className="text-base font-semibold text-gray-800 mb-1.5">{recommendation.action}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{recommendation.reasoning}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 leading-relaxed">
          ⚠ Experimental estimate only — not a prediction or guarantee. This is not financial
          advice. Always do your own research before making any investment decisions.
        </p>
      </div>
    </div>
  );
}
