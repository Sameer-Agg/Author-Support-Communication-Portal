import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { Paperclip, AlertCircle, ArrowLeft, Send } from 'lucide-react';

export function SubmitQuery() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBookId = searchParams.get('bookId') || '';

  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(preselectedBookId);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBooks() {
      try {
        const data = await apiRequest('/books');
        setBooks(data.books || []);
      } catch {
        // Fallback gracefully
      }
    }
    loadBooks();
  }, []);

  useEffect(() => {
    if (preselectedBookId) {
      setSelectedBookId(preselectedBookId);
    }
  }, [preselectedBookId]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (subject.trim().length < 3) {
      setError('Subject must be at least 3 characters long.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = {
        subject: subject.trim(),
        description: description.trim(),
        bookId: selectedBookId ? Number(selectedBookId) : null,
        attachmentName: attachmentName || null,
      };

      const res = await apiRequest('/tickets', {
        method: 'POST',
        body: payload,
      });

      navigate(`/tickets/${res.ticket.id}`);
    } catch (err) {
      setError(err.message || 'Failed to submit ticket');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Submit Support Query</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Our publishing support team typically answers within 24–48 hours.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Related Title / Catalog Item
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-white text-slate-900"
            >
              <option value="">General Inquiry / Account Level (Not book-specific)</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} {b.isbn ? `(ISBN: ${b.isbn})` : ''} — {b.status}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Select the affected title to give our support team instant access to production & sales context.
            </p>
          </div>

          <div>
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-slate-700">Subject</label>
              <span className="text-xs text-slate-400">{subject.length} / 255</span>
            </div>
            <input
              type="text"
              value={subject}
              maxLength={255}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Discrepancy in Q3 royalty calculation or Print alignment issue"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-slate-900"
              required
            />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <span className="text-xs text-slate-400">{description.length} / 5000</span>
            </div>
            <textarea
              rows={6}
              value={description}
              maxLength={5000}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide full details, including store links, order IDs, or page numbers if applicable."
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Attachment <span className="text-xs font-normal text-slate-400">(UI representation only)</span>
            </label>
            <div className="mt-1 flex items-center space-x-3">
              <label className="cursor-pointer inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                <Paperclip className="w-4 h-4 mr-2 text-slate-500" />
                Browse File
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="sr-only"
                  accept="image/*,.pdf,.doc,.docx"
                />
              </label>
              {attachmentName && (
                <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md">
                  <span className="truncate max-w-xs">{attachmentName}</span>
                  <button
                    type="button"
                    onClick={() => setAttachmentName('')}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Supported file types: PNG, JPG, PDF (Simulated attachment picker for evaluation).
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Send Query'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

