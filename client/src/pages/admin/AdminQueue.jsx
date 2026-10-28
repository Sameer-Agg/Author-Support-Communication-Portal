import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { PriorityBadge } from '../../components/common/PriorityBadge.jsx';
import { SourceIndicator } from '../../components/admin/SourceIndicator.jsx';
import { formatDate, formatRelativeTime, getCategoryLabel } from '../../utils/formatters.js';
import { Search, Filter, ShieldAlert, Sparkles, AlertCircle, ChevronLeft, ChevronRight, User } from 'lucide-react';

export function AdminQueue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { socket } = useSocket();

  const currentStatus = searchParams.get('status') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentPriority = searchParams.get('priority') || '';
  const currentSearch = searchParams.get('q') || '';
  const currentPage = Number(searchParams.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(currentSearch);

  const updateFilters = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (!v || v === 'all') updated.delete(k);
      else updated.set(k, v);
    });
    if (!newParams.page) updated.delete('page');
    setSearchParams(updated);
  };

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const data = await apiRequest(`/tickets${query}`);
      setTickets(data.tickets || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load tickets queue');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newTicket) => {
      setTickets((prev) => [newTicket, ...prev]);
    };

    const handleUpdated = (updated) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
    };

    const handleClassified = (classified) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === classified.id ? { ...t, ...classified } : t))
      );
    };

    socket.on('ticket:created', handleCreated);
    socket.on('ticket:updated', handleUpdated);
    socket.on('ai:classified', handleClassified);

    return () => {
      socket.off('ticket:created', handleCreated);
      socket.off('ticket:updated', handleUpdated);
      socket.off('ai:classified', handleClassified);
    };
  }, [socket]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ q: searchInput.trim(), page: 1 });
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Author Support Queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time multi-channel author inquiries with AI classification and deterministic priority routing.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-500 mt-2 sm:mt-0">
          Showing <span className="font-semibold text-slate-900">{pagination.total}</span> tickets
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
            onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
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
            onChange={(e) => updateFilters({ category: e.target.value, page: 1 })}
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
            onChange={(e) => updateFilters({ priority: e.target.value, page: 1 })}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {(currentStatus || currentCategory || currentPriority || currentSearch) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchParams(new URLSearchParams());
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-900">No tickets found</h3>
          <p className="mt-1 text-sm text-slate-500">
            No support requests match the selected filters.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3 text-left">Ticket & Author</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Assignee</th>
                  <th className="px-4 py-3 text-right">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {tickets.map((t) => {
                  const isCritical = t.priority === 'critical';
                  const isOld =
                    t.status !== 'resolved' &&
                    t.status !== 'closed' &&
                    new Date() - new Date(t.createdAt) > 48 * 3600 * 1000;

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCritical
                          ? 'bg-rose-50/30'
                          : isOld
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <Link to={`/admin/tickets/${t.id}`} className="block group">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-slate-400 group-hover:text-slate-700">
                              #{t.id}
                            </span>
                            <span className="font-semibold text-slate-900 group-hover:text-emerald-700">
                              {t.subject}
                            </span>
                            {isCritical && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                URGENT
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            <span className="font-medium text-slate-700">{t.authorName}</span>
                            {t.bookTitle && (
                              <span> • Book: <span className="italic">{t.bookTitle}</span></span>
                            )}
                          </div>
                        </Link>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-medium text-slate-800">
                            {getCategoryLabel(t.category)}
                          </span>
                          <SourceIndicator source={t.categorySource} />
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <PriorityBadge priority={t.priority} />
                          <SourceIndicator source={t.prioritySource} />
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={t.status} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                        {t.assigneeName ? (
                          <span className="font-medium text-slate-800">{t.assigneeName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right text-slate-500 font-mono">
                        {formatRelativeTime(t.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Page <span className="font-semibold">{pagination.page}</span> of{' '}
                <span className="font-semibold">{pagination.totalPages}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => updateFilters({ page: pagination.page - 1 })}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => updateFilters({ page: pagination.page + 1 })}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

