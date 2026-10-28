export function PriorityBadge({ priority }) {
  const styles = {
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    medium: 'bg-sky-50 text-sky-700 border-sky-200',
    low: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const labels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const normalized = priority ? priority.toLowerCase() : 'medium';
  const badgeStyle = styles[normalized] || 'bg-slate-50 text-slate-600 border-slate-200';
  const label = labels[normalized] || priority || 'Medium';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeStyle}`}>
      {label}
    </span>
  );
}

