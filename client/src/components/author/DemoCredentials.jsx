export function DemoCredentials({ onSelectAuthor, onSelectAdmin }) {
  const demoAccounts = [
    {
      title: 'Author Priya',
      email: import.meta.env.VITE_DEMO_AUTHOR_EMAIL || 'priya.sharma@email.com',
      onSelect: onSelectAuthor,
    },
    {
      title: 'Admin Account',
      email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@bookleaf.in',
      onSelect: onSelectAdmin,
    },
  ];

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
        Quick Test Credentials
      </p>
      <div className="grid grid-cols-2 gap-2">
        {demoAccounts.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={account.onSelect}
            className="px-2.5 py-1.5 text-xs text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 font-medium transition-colors"
          >
            <div className="font-semibold text-slate-900">{account.title}</div>
            <div className="text-[10px] text-slate-500 truncate">{account.email}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
