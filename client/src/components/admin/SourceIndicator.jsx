import { Sparkles, UserCheck, Shield } from 'lucide-react';

export function SourceIndicator({ source }) {
  if (source === 'admin') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200" title="Overridden by Administrator">
        <UserCheck className="w-3 h-3 mr-1" />
        Admin
      </span>
    );
  }

  if (source === 'ai') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200" title="Classified by AI Engine">
        <Sparkles className="w-3 h-3 mr-1" />
        AI
      </span>
    );
  }

  if (source === 'default') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200" title="Heuristic Default Rule">
        <Shield className="w-3 h-3 mr-1" />
        Default
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200" title="Pending Classification">
      Pending
    </span>
  );
}

