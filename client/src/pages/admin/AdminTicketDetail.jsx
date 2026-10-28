import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { PriorityBadge } from '../../components/common/PriorityBadge.jsx';
import { AlertBanner } from '../../components/common/AlertBanner.jsx';
import { BookFactsSidebar } from '../../components/admin/BookFactsSidebar.jsx';
import { AIDraftWorkspace } from '../../components/admin/AIDraftWorkspace.jsx';
import { InternalNotesPanel } from '../../components/admin/InternalNotesPanel.jsx';
import { AdminMessageBubble } from '../../components/admin/AdminMessageBubble.jsx';
import { AdminTicketActions } from '../../components/admin/AdminTicketActions.jsx';
import { AdminTicketInquiry } from '../../components/admin/AdminTicketInquiry.jsx';
import { ArrowLeft } from 'lucide-react';

export function AdminTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [internalNotes, setInternalNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const messagesEndRef = useRef(null);

  const loadTicket = useCallback(async () => {
    let mounted = true;
    try {
      setLoading(true);
      const data = await apiRequest(`/tickets/${id}`);
      if (mounted) {
        setTicket(data.ticket);
        setMessages(data.ticket.messages || []);
        setInternalNotes(data.ticket.internalNotes || []);
      }
    } catch (err) {
      if (mounted) setError(err.message || 'Failed to load ticket details');
    } finally {
      if (mounted) setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (!socket || !ticket) return;

    const handleNewMessage = (payload) => {
      if (Number(payload.ticketId) === Number(id)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
      }
    };

    const handleTicketUpdated = (updated) => {
      if (Number(updated.id) === Number(id)) {
        setTicket((prev) => ({ ...prev, ...updated }));
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('ticket:updated', handleTicketUpdated);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('ticket:updated', handleTicketUpdated);
    };
  }, [socket, ticket, id]);

  const handleUpdate = useCallback(
    async (patch) => {
      setUpdating(true);
      try {
        const data = await apiRequest(`/tickets/${id}`, {
          method: 'PATCH',
          body: patch,
        });
        setTicket((prev) => ({ ...prev, ...data.ticket }));
      } catch (err) {
        setError(err.message || 'Failed to update ticket');
      } finally {
        setUpdating(false);
      }
    },
    [id]
  );

  const handleAssignToMe = useCallback(() => {
    if (user?.id) {
      handleUpdate({ assignedTo: user.id });
    }
  }, [user, handleUpdate]);

  const handleStatusChange = useCallback(
    (e) => {
      handleUpdate({ status: e.target.value });
    },
    [handleUpdate]
  );

  const handlePriorityChange = useCallback(
    (e) => {
      handleUpdate({ priority: e.target.value });
    },
    [handleUpdate]
  );

  const handleCategoryChange = useCallback(
    (e) => {
      handleUpdate({ category: e.target.value });
    },
    [handleUpdate]
  );

  const handleBackToQueue = useCallback(() => {
    navigate('/admin/queue');
  }, [navigate]);

  const handleReplySent = useCallback((newMsg) => {
    setMessages((prev) => [...prev, newMsg]);
    setTicket((prev) => ({ ...prev, status: 'in_progress' }));
  }, []);

  const handleNoteAdded = useCallback((newNote) => {
    setInternalNotes((prev) => [...prev, newNote]);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-white rounded-lg border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <AlertBanner message={error} />
        <button
          type="button"
          onClick={handleBackToQueue}
          className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/queue"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-semibold text-slate-400">#{ticket.id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
              {ticket.subject}
            </h1>
          </div>
        </div>

        <AdminTicketActions
          ticket={ticket}
          currentUserId={user?.id}
          updating={updating}
          onAssignToMe={handleAssignToMe}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AdminTicketInquiry
            description={ticket.description}
            attachmentName={ticket.attachmentName}
          />

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-80">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              Public Correspondence Thread
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((m) => (
                <AdminMessageBubble key={m.id} message={m} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <AIDraftWorkspace
            ticketId={ticket.id}
            onReplySent={handleReplySent}
          />

          <InternalNotesPanel
            ticketId={ticket.id}
            initialNotes={internalNotes}
            onNoteAdded={handleNoteAdded}
          />
        </div>

        <div className="lg:col-span-1">
          <BookFactsSidebar ticket={ticket} />
        </div>
      </div>
    </div>
  );
}
