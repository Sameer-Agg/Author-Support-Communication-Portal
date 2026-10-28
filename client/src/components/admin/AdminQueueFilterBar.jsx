import { Search, Filter } from 'lucide-react';
import {
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
} from '../../utils/constants.js';

export function AdminQueueFilterBar({
  searchInput,
  currentStatus,
  currentCategory,
  currentPriority,
  hasActiveFilters,
  onSearchChange,
  onSearchSubmit,
  onFilterChange,
  onResetFilters,
}) {
  const filterGroups = [
    {
      key: 'status',
      value: currentStatus,
      defaultLabel: 'All Statuses',
      options: STATUS_OPTIONS,
    },
    {
      key: 'category',
      value: currentCategory,
      defaultLabel: 'All Categories',
      options: CATEGORY_OPTIONS,
    },
    {
      key: 'priority',
      value: currentPriority,
      defaultLabel: 'All Priorities',
      options: PRIORITY_OPTIONS,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchInput}
            onChange={onSearchChange}
            placeholder="Search by ticket subject, description, author name, or book title..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {filterGroups.map((group) => (
          <select
            key={group.key}
            value={group.value}
            onChange={(e) => onFilterChange({ [group.key]: e.target.value, page: 1 })}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">{group.defaultLabel}</option>
            {group.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold ml-auto transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
