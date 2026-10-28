import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { formatRelativeTime, getCategoryLabel } from '../../utils/formatters.js';
import { MessageSquare, ChevronRight } from 'lucide-react';

export function TicketCard({ ticket }) {
  const updatedTime = formatRelativeTime(ticket.updatedAt || ticket.createdAt);
  const messageCount = ticket.messageCount || 1;

  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="block p-5 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono font-semibold text-slate-400">
            #{ticket.id}
          </span>
          <StatusBadge status={ticket.status} />
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
            {getCategoryLabel(ticket.category)}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          Updated {updatedTime}
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{ticket.subject}</h3>
          {ticket.bookTitle && (
            <div className="text-xs text-slate-500 mt-0.5">
              Book: <span className="font-medium text-slate-700">{ticket.bookTitle}</span>
            </div>
          )}
          <p className="text-sm text-slate-600 mt-1 line-clamp-1">{ticket.description}</p>
        </div>
        <div className="flex items-center space-x-4 pl-4 flex-shrink-0 text-slate-400">
          <div className="flex items-center text-xs text-slate-500">
            <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>{messageCount}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </div>
    </Link>
  );
}

