import { Link } from 'react-router-dom';

export function EmptyState({ icon: Icon, title, description, actionText, actionPath, onAction }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
      {Icon && <Icon className="w-12 h-12 text-slate-400 mx-auto mb-3" />}
      <h3 className="text-base font-medium text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {actionText && actionPath && (
        <div className="mt-6">
          <Link
            to={actionPath}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
          >
            {actionText}
          </Link>
        </div>
      )}
      {actionText && onAction && !actionPath && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
}

