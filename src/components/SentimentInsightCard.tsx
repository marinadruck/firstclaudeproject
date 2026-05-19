import type { SentimentExplanation, AdvancedSentimentSummary } from '@/types';

const LABEL_STYLE = {
  Positive: 'bg-green-100 text-green-700',
  Negative: 'bg-red-100 text-red-700',
  Neutral:  'bg-gray-100 text-gray-500',
};

interface Props {
  explanation: SentimentExplanation;
  advancedSentiment?: AdvancedSentimentSummary;
}

export default function SentimentInsightCard({ explanation, advancedSentiment }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Sentiment Analysis
      </p>
      <p className="text-sm text-gray-700 leading-relaxed mb-3">{explanation.summary}</p>
      <ul className="space-y-1.5">
        {explanation.keyDrivers.map((driver, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="mt-0.5 text-gray-400 shrink-0">•</span>
            {driver}
          </li>
        ))}
      </ul>

      {advancedSentiment && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${LABEL_STYLE[advancedSentiment.label]}`}>
              {advancedSentiment.label}
            </span>
            <span className="text-xs text-gray-400">
              Confidence: <span className="font-medium text-gray-600">{advancedSentiment.confidence}</span>
            </span>
            <span className="ml-auto text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
              Advanced local · LLM-ready
            </span>
          </div>

          {/* Score comparison */}
          <p className="text-xs text-gray-400 mb-2">
            Advanced score: <span className="font-medium text-gray-600">{(advancedSentiment.score * 100).toFixed(0)}</span>
            {' '}· Basic score: <span className="font-medium text-gray-600">{(advancedSentiment.basicScore * 100).toFixed(0)}</span>
          </p>

          {/* Top reasons */}
          {advancedSentiment.topReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {advancedSentiment.topReasons.map((reason, i) => (
                <span
                  key={i}
                  className="text-xs bg-gray-50 border border-gray-200 text-gray-600 rounded px-2 py-0.5"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">
            AI-style sentiment prototype · not using a real LLM
          </p>
        </div>
      )}
    </div>
  );
}
