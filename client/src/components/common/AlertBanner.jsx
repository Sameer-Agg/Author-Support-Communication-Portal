import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function AlertBanner({ type = 'error', message }) {
  if (!message) return null;

  const styles = {
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />,
  };

  const containerStyle = styles[type] || styles.error;
  const icon = icons[type] || icons.error;

  return (
    <div className={`p-3 rounded-md border flex items-start space-x-2 text-sm ${containerStyle}`}>
      {icon}
      <span>{message}</span>
    </div>
  );
}

