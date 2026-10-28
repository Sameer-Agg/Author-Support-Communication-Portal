export function LoadingSpinner() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="mt-3 text-xs font-medium text-slate-400 tracking-wide uppercase">
        Loading view...
      </span>
    </div>
  );
}

