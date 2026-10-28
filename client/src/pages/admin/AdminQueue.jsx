import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { AlertBanner } from '../../components/common/AlertBanner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { AdminQueueFilterBar } from '../../components/admin/AdminQueueFilterBar.jsx';
import { AdminQueueTable } from '../../components/admin/AdminQueueTable.jsx';
import { ShieldAlert } from 'lucide-react';

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

  const [searchInput, setSearchInput] = useState(currentSearch);

  const updateFilters = useCallback(
    (newParams) => {
      const updated = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([k, v]) => {
        if (!v || v === 'all') updated.delete(k);
        else updated.set(k, v);
      });
      if (!newParams.page) updated.delete('page');
      setSearchParams(updated);
    },
    [searchParams, setSearchParams]
  );

  const loadQueue = useCallback(async () => {
    let mounted = true;
    try {
      setLoading(true);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const data = await apiRequest(`/tickets${query}`);
      if (mounted) {
        setTickets(data.tickets || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      if (mounted) setError(err.message || 'Failed to load tickets queue');
    } finally {
      if (mounted) setLoading(false);
    }
    return () => {
      mounted = false;
    };
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

  const handleSearchChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (page) => {
      updateFilters({ page });
    },
    [updateFilters]
  );

  const hasActiveFilters = useMemo(() => {
    return Boolean(currentStatus || currentCategory || currentPriority || currentSearch);
  }, [currentStatus, currentCategory, currentPriority, currentSearch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Author Support Queue"
        subtitle="Real-time multi-channel author inquiries with AI classification and deterministic priority routing."
      >
        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-semibold text-slate-900">{pagination.total}</span> tickets
        </div>
      </PageHeader>

      <AdminQueueFilterBar
        searchInput={searchInput}
        currentStatus={currentStatus}
        currentCategory={currentCategory}
        currentPriority={currentPriority}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onFilterChange={updateFilters}
        onResetFilters={handleResetFilters}
      />

      <AlertBanner message={error} />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No tickets found"
          description="No support requests match the selected filters."
        />
      ) : (
        <AdminQueueTable
          tickets={tickets}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
