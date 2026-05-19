import type { SentimentExplanation } from '@/types';

export default function SentimentInsightCard({ explanation }: { explanation: SentimentExplanation }) {
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
    </div>
  );
}
