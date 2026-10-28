import { formatCurrency } from '../../utils/formatters.js';
import { Package, TrendingUp, DollarSign } from 'lucide-react';

export function BookStatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div className="flex items-center text-xs font-semibold text-slate-500 uppercase">
          <Package className="w-4 h-4 mr-1.5 text-slate-400" />
          Total Copies Sold
        </div>
        <div className="mt-2 text-xl font-bold text-slate-900">
          {stats.totalCopies.toLocaleString('en-IN')}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div className="flex items-center text-xs font-semibold text-slate-500 uppercase">
          <TrendingUp className="w-4 h-4 mr-1.5 text-slate-400" />
          Total Earned
        </div>
        <div className="mt-2 text-xl font-bold text-slate-900">
          {formatCurrency(stats.totalEarned)}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div className="flex items-center text-xs font-semibold text-slate-500 uppercase">
          <DollarSign className="w-4 h-4 mr-1.5 text-slate-400" />
          Royalty Paid
        </div>
        <div className="mt-2 text-xl font-bold text-slate-600">
          {formatCurrency(stats.totalPaid)}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div className="flex items-center text-xs font-semibold text-slate-500 uppercase">
          <DollarSign className="w-4 h-4 mr-1.5 text-emerald-600" />
          Royalty Pending
        </div>
        <div className="mt-2 text-xl font-bold text-emerald-700">
          {formatCurrency(stats.totalPending)}
        </div>
      </div>
    </div>
  );
}

