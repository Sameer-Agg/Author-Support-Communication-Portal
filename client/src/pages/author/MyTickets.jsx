import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { LifeBuoy, PlusCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { AlertBanner } from '../../components/common/AlertBanner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { TicketFilterTabs } from '../../components/author/TicketFilterTabs.jsx';
import { TicketCard } from '../../components/author/TicketCard.jsx';

const TICKET_TABS = [
  { key: 'all', label: 'All Queries' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

export function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { socket } = useSocket();

  const loadTickets = useCallback(async () => {
    let mounted = true;
    try {
      setLoading(true);
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const data = await apiRequest(`/tickets${query}`);
      if (mounted) setTickets(data.tickets || []);
    } catch (err) {
      if (mounted) setError(err.message || 'Failed to load tickets');
    } finally {
      if (mounted) setLoading(false);
    }
    return () => {
      mounted = false;
    };
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
    socket.on('message:created', handleNewMessage);

    return () => {
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('message:new', handleNewMessage);
      socket.off('message:created', handleNewMessage);
    };
  }, [socket]);

  const tabs = useMemo(() => TICKET_TABS, []);

  const handleSelectTab = useCallback((key) => {
    setStatusFilter(key);
  }, []);

  const emptyDescription = useMemo(() => {
    return statusFilter === 'all'
      ? 'You do not have any open support requests.'
      : `No tickets match the "${statusFilter.replace('_', ' ')}" status.`;
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Conversations"
        subtitle="View tickets, track resolution status, and correspond directly with BookLeaf editors & operations."
      >
        <Link
          to="/submit"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Query
        </Link>
      </PageHeader>

      <TicketFilterTabs
        tabs={tabs}
        activeTab={statusFilter}
        onSelectTab={handleSelectTab}
      />

      <AlertBanner message={error} />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No support tickets found"
          description={emptyDescription}
          actionText="Submit a support query"
          actionPath="/submit"
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-200 shadow-sm overflow-hidden">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}
