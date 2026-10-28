import { Send, CheckCircle2 } from 'lucide-react';

export function MessageComposer({
  replyText,
  sending,
  status,
  onChange,
  onKeyDown,
  onSubmit,
}) {
  const isReopenedNotice = status === 'resolved' || status === 'closed';

  return (
    <form onSubmit={onSubmit} className="p-4 bg-slate-50 border-t border-slate-200">
      {isReopenedNotice && (
        <div className="mb-2 text-xs text-slate-500 flex items-center">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          This ticket is marked {status}. Sending a message will automatically re-open it.
        </div>
      )}

      <div className="flex space-x-3">
        <textarea
          rows={2}
          value={replyText}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Type your reply here..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-slate-900 bg-white"
        />
        <button
          type="submit"
          disabled={sending || !replyText.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none disabled:opacity-50 self-end transition-colors"
        >
          <Send className="w-4 h-4 mr-1.5" />
          {sending ? 'Sending...' : 'Reply'}
        </button>
      </div>
    </form>
  );
}

