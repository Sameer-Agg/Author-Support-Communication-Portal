import { formatDateTime } from '../../utils/formatters.js';
import { Trash2 } from 'lucide-react';

export function MessageBubble({ message, currentUserId, onDelete }) {
  const isMe = message.senderId === currentUserId || message.senderRole === 'author';
  const senderLabel = isMe ? 'You' : `${message.senderName || 'BookLeaf Support'} (Support Team)`;
  const bubbleClass = isMe
    ? 'bg-emerald-600 text-white rounded-br-none'
    : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200';

  return (
    <div className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
        <span className="font-semibold text-slate-700">{senderLabel}</span>
        <span>•</span>
        <span>{formatDateTime(message.createdAt)}</span>
        {isMe && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5"
            title="Delete your message"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className={`max-w-xl rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${bubbleClass}`}>
        {message.body}
      </div>
    </div>
  );
}


