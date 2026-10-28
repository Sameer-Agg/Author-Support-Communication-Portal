import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { formatDate, formatRelativeTime, getCategoryLabel } from '../../utils/formatters.js';
import { LifeBuoy, MessageSquare, PlusCircle, AlertCircle, ChevronRight } from 'lucide-react';

export function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { socket } = useSocket();

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const data = await apiRequest(`/tickets${query}`);
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (!socket) return;

    const handleTicketUpdated = (updated) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
    };

    const handleNewMessage = (payload) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === payload.ticketId
            ? { ...t, messageCount: (t.messageCount || 0) + 1, updatedAt: new Date().toISOString() }
            : t
        )
      );
    };

    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('message:new', handleNewMessage);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Support Conversations</h1>
          <p className="mt-1 text-sm text-slate-500">
            View tickets, track resolution status, and correspond directly with BookLeaf editors & operations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            New Query
          </Link>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 pb-3">
        {[
          { key: 'all', label: 'All Queries' },
          { key: 'open', label: 'Open' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'resolved', label: 'Resolved' },
          { key: 'closed', label: 'Closed' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <LifeBuoy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-900">No support tickets found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {statusFilter === 'all'
              ? 'You do not have any open support requests.'
              : `No tickets match the "${statusFilter.replace('_', ' ')}" status.`}
          </p>
          <div className="mt-6">
            <Link
              to="/submit"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md"
            >
              Submit a support query
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-200 shadow-sm overflow-hidden">
          {tickets.map((t) => (
            <Link
              key={t.id}
              to={`/tickets/${t.id}`}
              className="block p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    #{t.id}
                  </span>
                  <StatusBadge status={t.status} />
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {getCategoryLabel(t.category)}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Updated {formatRelativeTime(t.updatedAt || t.createdAt)}
                </div>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{t.subject}</h3>
                  {t.bookTitle && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Book: <span className="font-medium text-slate-700">{t.bookTitle}</span>
                    </div>
                  )}
                  <p className="text-sm text-slate-600 mt-1 line-clamp-1">{t.description}</p>
                </div>
                <div className="flex items-center space-x-4 pl-4 flex-shrink-0 text-slate-400">
                  <div className="flex items-center text-xs text-slate-500">
                    <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <span>{t.messageCount || 1}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

