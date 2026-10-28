import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { AlertBanner } from '../../components/common/AlertBanner.jsx';
import { AttachmentViewer } from '../../components/common/AttachmentViewer.jsx';
import { MessageBubble } from '../../components/author/MessageBubble.jsx';
import { MessageComposer } from '../../components/author/MessageComposer.jsx';
import { formatDate, getCategoryLabel } from '../../utils/formatters.js';
import { ArrowLeft } from 'lucide-react';

export function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadTicket = useCallback(async () => {
    let mounted = true;
    try {
      setLoading(true);
      const data = await apiRequest(`/tickets/${id}`);
      if (mounted) {
        setTicket(data.ticket);
        setMessages(data.ticket.messages || []);
      }
    } catch (err) {
      if (mounted) setError(err.message || 'Failed to load ticket');
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
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!socket) return;

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

    const handleMessageDeleted = (payload) => {
      if (Number(payload.ticketId) === Number(id)) {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:created', handleNewMessage);
    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:created', handleNewMessage);
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('message:deleted', handleMessageDeleted);
    };
  }, [socket, id]);

  const handleBackToTickets = useCallback(() => {
    navigate('/tickets');
  }, [navigate]);

  const handleReplyTextChange = useCallback((e) => {
    setReplyText(e.target.value);
  }, []);

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      if (!window.confirm('Are you sure you want to delete your note/message?')) return;
      try {
        await apiRequest(`/tickets/${id}/messages/${messageId}`, {
          method: 'DELETE',
        });
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (err) {
        setError(err.message || 'Failed to delete message');
      }
    },
    [id]
  );

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || sending) return;

    const text = replyText.trim();
    setReplyText('');
    setSending(true);

    try {
      const data = await apiRequest(`/tickets/${id}/messages`, {
        method: 'POST',
        body: { body: text },
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });

      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        setTicket((prev) => ({ ...prev, status: 'in_progress' }));
      }
    } catch (err) {
      setError(err.message || 'Failed to send reply');
      setReplyText(text);
    } finally {
      setSending(false);
    }
  };

  const handleReplyKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSendMessage(e);
      }
    },
    [handleSendMessage]
  );

  const ticketMetadata = useMemo(() => {
    if (!ticket) return [];
    return [
      { label: 'Created', value: formatDate(ticket.createdAt) },
      {
        label: 'Related Book',
        value: ticket.bookTitle ? (
          <span className="font-medium text-slate-900">{ticket.bookTitle}</span>
        ) : (
          'General / Account Level'
        ),
      },
      (ticket.attachmentName || ticket.attachmentUrl)
        ? {
            label: 'Attachment',
            value: (
              <AttachmentViewer
                attachmentName={ticket.attachmentName}
                attachmentUrl={ticket.attachmentUrl}
              />
            ),
          }
        : null,
    ].filter(Boolean);
  }, [ticket]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-white rounded-lg border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <AlertBanner message={error} />
        <button
          type="button"
          onClick={handleBackToTickets}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          to="/tickets"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-semibold text-slate-400">#{ticket.id}</span>
            <StatusBadge status={ticket.status} />
            <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              {getCategoryLabel(ticket.category)}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            {ticket.subject}
          </h1>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 text-sm space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          {ticketMetadata.map((meta) => (
            <div key={meta.label}>
              <span className="font-semibold text-slate-500 mr-1">{meta.label}:</span>
              {meta.value}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-[520px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Message Thread
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              currentUserId={user?.id}
              onDelete={handleDeleteMessage}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <MessageComposer
          replyText={replyText}
          sending={sending}
          status={ticket.status}
          onChange={handleReplyTextChange}
          onKeyDown={handleReplyKeyDown}
          onSubmit={handleSendMessage}
        />
      </div>
    </div>
  );
}
