import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { BookOpen, User, DollarSign, Store, Printer, Tag, Calendar, AlertTriangle } from 'lucide-react';

export function BookFactsSidebar({ ticket }) {
  const isRollover =
    Number(ticket?.bookRoyaltyPending) > 0 && Number(ticket?.bookRoyaltyPending) < 1000;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          <User className="w-4 h-4 text-slate-500" />
          <span>Author Profile</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div>
            <div className="font-semibold text-slate-900">{ticket.authorName}</div>
            <div className="text-slate-500">{ticket.authorEmail}</div>
          </div>
          {ticket.authorPhone && (
            <div className="text-slate-600">
              <span className="text-slate-400">Phone:</span> {ticket.authorPhone}
            </div>
          )}
          {ticket.authorCity && (
            <div className="text-slate-600">
              <span className="text-slate-400">City:</span> {ticket.authorCity}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <span>Catalog & Production Context</span>
        </div>

        {ticket.bookId ? (
          <div className="space-y-3 text-xs">
            <div>
              <div className="font-semibold text-slate-900">{ticket.bookTitle}</div>
              <div className="text-[11px] font-mono text-slate-500">
                Code: {ticket.bookCode} • ISBN: {ticket.bookIsbn || 'Pending'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                <span className="font-medium text-slate-800">{ticket.bookStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Pub Date</span>
                <span className="font-medium text-slate-800">
                  {ticket.bookPublicationDate ? formatDate(ticket.bookPublicationDate) : 'In Production'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">MRP</span>
                <span className="font-medium text-slate-800">{formatCurrency(ticket.bookMrp)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Print Partner</span>
                <span className="font-medium text-slate-800">{ticket.bookPrintPartner || 'In-House'}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-md space-y-1.5 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Pending Royalty:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(ticket.bookRoyaltyPending)}
                </span>
              </div>
              {isRollover && (
                <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 flex items-start space-x-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Below ₹1,000 threshold. Will rollover to next quarter.</span>
                </div>
              )}
            </div>

            {ticket.bookAvailableOn && ticket.bookAvailableOn.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase mb-1">Live Platforms</span>
                <div className="flex flex-wrap gap-1">
                  {ticket.bookAvailableOn.map((p) => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 py-3 italic">
            General query not attached to a specific published title.
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1 text-slate-500">
        <div className="font-semibold text-slate-700">AI Context Classification:</div>
        <div>
          Status: <span className="font-mono text-slate-800">{ticket.aiStatus || 'pending'}</span>
        </div>
        {ticket.aiReason && (
          <div className="text-[11px] text-slate-600 italic mt-1 leading-snug">
            "{ticket.aiReason}"
          </div>
        )}
      </div>
    </div>
  );
}

