import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { formatDate, formatDateTime, getCategoryLabel } from '../../utils/formatters.js';
import { ArrowLeft, Send, AlertCircle, Paperclip, CheckCircle2 } from 'lucide-react';

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTicket = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/tickets/${id}`);
      setTicket(data.ticket);
      setMessages(data.ticket.messages || []);
    } catch (err) {
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
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
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
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
          <div>
            <span className="font-semibold text-slate-500">Created:</span>{' '}
            {formatDate(ticket.createdAt)}
          </div>
          <div>
            <span className="font-semibold text-slate-500">Related Book:</span>{' '}
            {ticket.bookTitle ? (
              <span className="font-medium text-slate-900">{ticket.bookTitle}</span>
            ) : (
              'General / Account Level'
            )}
          </div>
          {ticket.attachmentName && (
            <div className="flex items-center">
              <Paperclip className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span className="font-semibold text-slate-500 mr-1">Attachment:</span>
              <span className="truncate">{ticket.attachmentName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-[520px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Message Thread
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === user.id || msg.senderRole === 'author';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">
                    {isMe ? 'You' : `${msg.senderName || 'BookLeaf Support'} (Support Team)`}
                  </span>
                  <span>•</span>
                  <span>{formatDateTime(msg.createdAt)}</span>
                </div>
                <div
                  className={`max-w-xl rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                  }`}
                >
                  {msg.body}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-200">
          {ticket.status === 'resolved' || ticket.status === 'closed' ? (
            <div className="mb-2 text-xs text-slate-500 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              This ticket is marked {ticket.status}. Sending a message will automatically re-open it.
            </div>
          ) : null}

          <div className="flex space-x-3">
            <textarea
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-slate-900 bg-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSendMessage(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none disabled:opacity-50 self-end"
            >
              <Send className="w-4 h-4 mr-1.5" />
              {sending ? 'Sending...' : 'Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

