import { UserCheck } from 'lucide-react';
import { SourceIndicator } from './SourceIndicator.jsx';
import {
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
} from '../../utils/constants.js';

export function AdminTicketActions({
  ticket,
  currentUserId,
  updating,
  onAssignToMe,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
}) {
  const selectControls = [
    {
      label: 'Status:',
      value: ticket.status,
      onChange: onStatusChange,
      options: STATUS_OPTIONS,
      source: null,
    },
    {
      label: 'Priority:',
      value: ticket.priority,
      onChange: onPriorityChange,
      options: PRIORITY_OPTIONS,
      source: ticket.prioritySource,
    },
    {
      label: 'Category:',
      value: ticket.category,
      onChange: onCategoryChange,
      options: CATEGORY_OPTIONS,
      source: ticket.categorySource,
    },
  ];

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

      {selectControls.map((ctrl) => (
        <div
          key={ctrl.label}
          className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-md px-2 py-1 shadow-2xs"
        >
          <span className="text-[10px] text-slate-400 uppercase font-semibold">{ctrl.label}</span>
          <select
            value={ctrl.value}
            onChange={ctrl.onChange}
            disabled={updating}
            className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          >
            {ctrl.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {ctrl.source && <SourceIndicator source={ctrl.source} />}
        </div>
      ))}
    </div>
  );
}
