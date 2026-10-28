import { useState } from 'react';
import { apiRequest } from '../../api/client.js';
import { formatDateTime } from '../../utils/formatters.js';
import { Lock, Plus, Send, AlertCircle } from 'lucide-react';

export function InternalNotesPanel({ ticketId, initialNotes = [], onNoteAdded }) {
  const [notes, setNotes] = useState(initialNotes);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || submitting) return;

    setError('');
    setSubmitting(true);
    try {
      const data = await apiRequest(`/tickets/${ticketId}/notes`, {
        method: 'POST',
        body: { note: noteText.trim() },
      });
      const newNote = data.note;
      setNotes((prev) => [...prev, newNote]);
      setNoteText('');
      if (onNoteAdded) onNoteAdded(newNote);
    } catch (err) {
      setError(err.message || 'Failed to add internal note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-amber-50/40 border border-amber-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-amber-100/70 border-b border-amber-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-amber-800" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Internal Operations Notes
          </span>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
          Not visible to author
        </span>
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <div className="p-2 text-xs rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-2">
            No internal notes recorded yet. Notes added here are strictly isolated from the author.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {notes.map((n) => (
              <div
                key={n.id}
                className="p-3 bg-white border border-amber-200/80 rounded-md text-xs space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold text-slate-800">{n.adminName || 'Admin'}</span>
                  <span className="text-[10px]">{formatDateTime(n.createdAt)}</span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{n.note}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="pt-2 border-t border-amber-200/60">
          <div className="flex space-x-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add an internal operations note..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
            />
            <button
              type="submit"
              disabled={submitting || !noteText.trim()}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-md disabled:opacity-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {submitting ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

