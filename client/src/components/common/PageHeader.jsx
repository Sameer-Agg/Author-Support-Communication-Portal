import { ArrowLeft } from 'lucide-react';

export function PageHeader({ title, subtitle, onBack, children }) {
  return (
    <div className="sm:flex sm:items-center sm:justify-between">
      <div className="flex items-center space-x-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="mt-4 sm:mt-0">{children}</div>}
    </div>
  );
}

