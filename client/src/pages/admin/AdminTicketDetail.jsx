import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { PriorityBadge } from '../../components/common/PriorityBadge.jsx';
import { SourceIndicator } from '../../components/admin/SourceIndicator.jsx';
import { BookFactsSidebar } from '../../components/admin/BookFactsSidebar.jsx';
import { AIDraftWorkspace } from '../../components/admin/AIDraftWorkspace.jsx';
import { InternalNotesPanel } from '../../components/admin/InternalNotesPanel.jsx';
import { formatDateTime, getCategoryLabel } from '../../utils/formatters.js';
import { ArrowLeft, UserCheck, Check, AlertCircle, Paperclip } from 'lucide-react';

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
    try {
      setLoading(true);
      const data = await apiRequest(`/tickets/${id}`);
      setTicket(data.ticket);
      setMessages(data.ticket.messages || []);
      setInternalNotes(data.ticket.internalNotes || []);
    } catch (err) {
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
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

  const handleUpdate = async (patch) => {
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
  };

  const handleAssignToMe = () => {
    if (user?.id) {
      handleUpdate({ assignedTo: user.id });
    }
  };

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
        <div className="p-4 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/queue')}
          className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900"
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

        <div className="flex flex-wrap items-center gap-2">
          {ticket.assignedTo !== user.id && (
            <button
              type="button"
              onClick={handleAssignToMe}
              disabled={updating}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Assign to Me
            </button>
          )}

          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-md px-2 py-1 shadow-2xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Status:</span>
            <select
              value={ticket.status}
              onChange={(e) => handleUpdate({ status: e.target.value })}
              disabled={updating}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-md px-2 py-1 shadow-2xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Priority:</span>
            <select
              value={ticket.priority}
              onChange={(e) => handleUpdate({ priority: e.target.value })}
              disabled={updating}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <SourceIndicator source={ticket.prioritySource} />
          </div>

          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-md px-2 py-1 shadow-2xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Category:</span>
            <select
              value={ticket.category}
              onChange={(e) => handleUpdate({ category: e.target.value })}
              disabled={updating}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="royalty_payments">Royalty & Payments</option>
              <option value="isbn_metadata">ISBN & Metadata</option>
              <option value="printing_quality">Printing Quality</option>
              <option value="distribution_availability">Distribution & Availability</option>
              <option value="book_status_production">Production Status</option>
              <option value="general_inquiry">General Inquiry</option>
            </select>
            <SourceIndicator source={ticket.categorySource} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Author Inquiry
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
            {ticket.attachmentName && (
              <div className="pt-2 flex items-center text-xs text-slate-500 border-t border-slate-100">
                <Paperclip className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <span>Attachment: </span>
                <span className="font-medium text-slate-700 ml-1">{ticket.attachmentName}</span>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-80">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              Public Correspondence Thread
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((m) => {
                const isAuthor = m.senderRole === 'author';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAuthor ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-0.5">
                      <span className="font-semibold text-slate-700">
                        {m.senderName} ({m.senderRole === 'author' ? 'Author' : 'BookLeaf Operations'})
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(m.createdAt)}</span>
                    </div>
                    <div
                      className={`max-w-lg rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                        isAuthor
                          ? 'bg-slate-100 text-slate-900 border border-slate-200'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <AIDraftWorkspace
            ticketId={ticket.id}
            onReplySent={(newMsg) => {
              setMessages((prev) => [...prev, newMsg]);
              setTicket((prev) => ({ ...prev, status: 'in_progress' }));
            }}
          />

          <InternalNotesPanel
            ticketId={ticket.id}
            initialNotes={internalNotes}
            onNoteAdded={(newNote) => setInternalNotes((prev) => [...prev, newNote])}
          />
        </div>

        <div className="lg:col-span-1">
          <BookFactsSidebar ticket={ticket} />
        </div>
      </div>
    </div>
  );
}

