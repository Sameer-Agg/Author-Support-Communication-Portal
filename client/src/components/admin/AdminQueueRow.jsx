import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { PriorityBadge } from '../common/PriorityBadge.jsx';
import { SourceIndicator } from './SourceIndicator.jsx';
import { formatRelativeTime, getCategoryLabel } from '../../utils/formatters.js';

export function AdminQueueRow({ ticket }) {
  const isCritical = ticket.priority === 'critical';
  const isOld =
    ticket.status !== 'resolved' &&
    ticket.status !== 'closed' &&
    new Date() - new Date(ticket.createdAt) > 48 * 3600 * 1000;

  const rowBgClass = isCritical
    ? 'bg-rose-50/30'
    : isOld
    ? 'bg-amber-50/20'
    : '';

  return (
    <tr className={`hover:bg-slate-50/80 transition-colors ${rowBgClass}`}>
      <td className="px-5 py-3.5">
        <Link to={`/admin/tickets/${ticket.id}`} className="block group">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-slate-400 group-hover:text-slate-700">
              #{ticket.id}
            </span>
            <span className="font-semibold text-slate-900 group-hover:text-emerald-700">
              {ticket.subject}
            </span>
            {isCritical && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                URGENT
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            <span className="font-medium text-slate-700">{ticket.authorName}</span>
            {ticket.bookTitle && (
              <span> • Book: <span className="italic">{ticket.bookTitle}</span></span>
            )}
          </div>
        </Link>
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center space-x-1.5">
          <span className="font-medium text-slate-800">
            {getCategoryLabel(ticket.category)}
          </span>
          <SourceIndicator source={ticket.categorySource} />
        </div>
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center space-x-1.5">
          <PriorityBadge priority={ticket.priority} />
          <SourceIndicator source={ticket.prioritySource} />
        </div>
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        <StatusBadge status={ticket.status} />
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
        {ticket.assigneeName ? (
          <span className="font-medium text-slate-800">{ticket.assigneeName}</span>
        ) : (
          <span className="text-slate-400 italic">Unassigned</span>
        )}
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap text-right text-slate-500 font-mono">
        {formatRelativeTime(ticket.createdAt)}
      </td>
    </tr>
  );
}

