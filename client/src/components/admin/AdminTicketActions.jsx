import { UserCheck } from 'lucide-react';
import { SourceIndicator } from './SourceIndicator.jsx';

export function AdminTicketActions({
  ticket,
  currentUserId,
  updating,
  onAssignToMe,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ticket.assignedTo !== currentUserId && (
        <button
          type="button"
          onClick={onAssignToMe}
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
          onChange={onStatusChange}
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
          onChange={onPriorityChange}
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
          onChange={onCategoryChange}
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
  );
}

