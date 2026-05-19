import type { Headline } from '@/types';

export default function HeadlineList({ headlines }: { headlines: Headline[] }) {
  return (
    <ul className="divide-y divide-gray-100">
      {headlines.map((h, i) => (
        <li key={i} className="py-3 first:pt-0 last:pb-0">
          <a href={h.url} target="_blank" rel="noopener noreferrer" className="group block">
            <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors leading-snug">
              {h.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {h.source} &middot;{' '}
              {new Date(h.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
