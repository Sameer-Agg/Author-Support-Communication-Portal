import { formatDateTime } from '../../utils/formatters.js';

export function AdminMessageBubble({ message }) {
  const isAuthor = message.senderRole === 'author';
  const roleName = isAuthor ? 'Author' : 'BookLeaf Operations';

  return (
    <div className={`flex flex-col ${isAuthor ? 'items-start' : 'items-end'}`}>
      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-0.5">
        <span className="font-semibold text-slate-700">
          {message.senderName} ({roleName})
        </span>
        <span>•</span>
        <span>{formatDateTime(message.createdAt)}</span>
      </div>
      <div
        className={`max-w-lg rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap ${
          isAuthor
            ? 'bg-slate-100 text-slate-900 border border-slate-200'
            : 'bg-emerald-600 text-white'
        }`}
      >
        {message.body}
      </div>
    </div>
  );
}

