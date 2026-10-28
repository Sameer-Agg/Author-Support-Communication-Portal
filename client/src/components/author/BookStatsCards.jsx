import { formatCurrency } from '../../utils/formatters.js';
import { Package, TrendingUp, DollarSign } from 'lucide-react';

export function BookStatsCards({ stats }) {
  const cards = [
    {
      label: 'Total Copies Sold',
      icon: Package,
      value: stats.totalCopies.toLocaleString('en-IN'),
      iconColor: 'text-slate-400',
      valueColor: 'text-slate-900',
    },
    {
      label: 'Total Earned',
      icon: TrendingUp,
      value: formatCurrency(stats.totalEarned),
      iconColor: 'text-slate-400',
      valueColor: 'text-slate-900',
    },
    {
      label: 'Royalty Paid',
      icon: DollarSign,
      value: formatCurrency(stats.totalPaid),
      iconColor: 'text-slate-400',
      valueColor: 'text-slate-600',
    },
    {
      label: 'Royalty Pending',
      icon: DollarSign,
      value: formatCurrency(stats.totalPending),
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <div className="flex items-center text-xs font-semibold text-slate-500 uppercase">
              <Icon className={`w-4 h-4 mr-1.5 ${card.iconColor}`} />
              {card.label}
            </div>
            <div className={`mt-2 text-xl font-bold ${card.valueColor}`}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
