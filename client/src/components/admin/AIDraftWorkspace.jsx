import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../api/client.js';
import { Sparkles, RefreshCw, Send, Trash2, AlertCircle, Edit3 } from 'lucide-react';

export function AIDraftWorkspace({ ticketId, onReplySent }) {
  const [draft, setDraft] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isManual, setIsManual] = useState(false);

  const fetchDraft = useCallback(
    async (force = false) => {
      try {
        if (force) setRegenerating(true);
        else setLoading(true);
        setError('');

        const url = `/tickets/${ticketId}/draft${force ? '?regenerate=true' : ''}`;
        const data = await apiRequest(url, { method: 'POST' });
        setDraft(data.draft);
        setDraftText(data.draft.draftText || '');
        setIsManual(false);
      } catch (err) {
        setError(err.message || 'AI Draft generation unavailable. You can compose a manual reply.');
        setIsManual(true);
      } finally {
        setLoading(false);
        setRegenerating(false);
      }
    },
    [ticketId]
  );

  useEffect(() => {
    fetchDraft(false);
  }, [fetchDraft]);

  const handleRegenerateClick = useCallback(() => {
    fetchDraft(true);
  }, [fetchDraft]);

  const handleDraftTextChange = useCallback((e) => {
    setDraftText(e.target.value);
  }, []);

  const handleDiscard = useCallback(() => {
    setDraftText('');
    setIsManual(true);
  }, []);

  const handleSwitchToManual = useCallback(() => {
    setIsManual(true);
  }, []);

  const handleSend = async () => {
    if (!draftText.trim() || sending) return;

    setError('');
    setSending(true);
    try {
      const data = await apiRequest(`/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: { body: draftText.trim() },
      });
      setDraftText('');
      if (onReplySent) onReplySent(data.message);
    } catch (err) {
      setError(err.message || 'Failed to send message to author');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-indigo-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
            AI Response Assistant
          </span>
          {draft?.model && (
            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-100/60 px-1.5 py-0.5 rounded">
              {draft.model}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleRegenerateClick}
            disabled={regenerating || loading}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100/70 rounded transition-colors disabled:opacity-50"
            title="Regenerate draft using latest context"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Drafting...' : 'Regenerate'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={handleRegenerateClick}
              className="text-amber-900 underline font-semibold text-xs ml-2"
            >
              Retry AI
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">
              Generating contextual reply with computed facts and policy context...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                rows={8}
                value={draftText}
                onChange={handleDraftTextChange}
                placeholder="Compose reply to author or wait for AI draft..."
                className="w-full p-3 text-xs leading-relaxed border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-sans"
              />
              <div className="absolute right-2.5 bottom-2.5 text-[10px] text-slate-400">
                {isManual ? 'Manual Mode' : 'AI Draft (Editable)'}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                {draftText && (
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="inline-flex items-center px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSwitchToManual}
                  className={`inline-flex items-center px-2.5 py-1 text-xs rounded transition-colors ${
                    isManual
                      ? 'bg-slate-200 text-slate-800 font-semibold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  Manual Compose
                </button>
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !draftText.trim()}
                className="inline-flex items-center px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {sending ? 'Sending...' : 'Send to Author'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
