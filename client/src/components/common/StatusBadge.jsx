export function StatusBadge({ status }) {
  const styles = {
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-blue-50 text-blue-700 border-blue-200',
    closed: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  const normalized = status ? status.toLowerCase() : 'open';
  const badgeStyle = styles[normalized] || 'bg-slate-100 text-slate-600 border-slate-200';
  const label = labels[normalized] || status || 'Open';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle}`}>
      {label}
    </span>
  );
}

