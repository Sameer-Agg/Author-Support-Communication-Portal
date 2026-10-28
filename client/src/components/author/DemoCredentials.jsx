export function DemoCredentials({ onSelectAuthor, onSelectAdmin }) {
  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
        Quick Test Credentials
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onSelectAuthor}
          className="px-2.5 py-1.5 text-xs text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium transition-colors"
        >
          <div className="font-semibold text-slate-900">Author Priya</div>
          <div className="text-[10px] text-slate-500 truncate">priya.sharma@email.com</div>
        </button>
        <button
          type="button"
          onClick={onSelectAdmin}
          className="px-2.5 py-1.5 text-xs text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium transition-colors"
        >
          <div className="font-semibold text-slate-900">Admin Account</div>
          <div className="text-[10px] text-slate-500 truncate">admin@bookleaf.in</div>
        </button>
      </div>
    </div>
  );
}

