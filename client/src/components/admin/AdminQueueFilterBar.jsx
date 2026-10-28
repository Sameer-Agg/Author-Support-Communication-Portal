import { Search, Filter } from 'lucide-react';

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

        <select
          value={currentStatus}
          onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
          className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={currentCategory}
          onChange={(e) => onFilterChange({ category: e.target.value, page: 1 })}
          className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700"
        >
          <option value="">All Categories</option>
          <option value="royalty_payments">Royalty & Payments</option>
          <option value="isbn_metadata">ISBN & Metadata</option>
          <option value="printing_quality">Printing Quality</option>
          <option value="distribution_availability">Distribution & Availability</option>
          <option value="book_status_production">Production Status</option>
          <option value="general_inquiry">General Inquiry</option>
        </select>

        <select
          value={currentPriority}
          onChange={(e) => onFilterChange({ priority: e.target.value, page: 1 })}
          className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

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

