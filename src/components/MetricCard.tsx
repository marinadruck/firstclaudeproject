interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  valueClassName?: string;
}

export default function MetricCard({
  label,
  value,
  subtitle,
  valueClassName = 'text-gray-900',
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-4xl font-bold mt-2 tabular-nums ${valueClassName}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
