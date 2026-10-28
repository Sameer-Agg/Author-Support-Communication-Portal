export function TicketFilterTabs({ tabs, activeTab, onSelectTab }) {
  return (
    <div className="flex space-x-2 border-b border-slate-200 pb-3">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const btnClass = isActive
          ? 'bg-slate-900 text-white'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${btnClass}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

