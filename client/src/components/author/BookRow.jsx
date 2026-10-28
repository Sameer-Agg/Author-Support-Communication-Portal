import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { ArrowUpRight } from 'lucide-react';

export function BookRow({ book }) {
  const isPendingRollover =
    Number(book.royaltyPending) > 0 && Number(book.royaltyPending) < 1000;
  const isProduction = !book.publicationDate || book.status.toLowerCase().includes('production');
  const formattedCopies =
    book.totalCopiesSold !== null && book.totalCopiesSold !== undefined
      ? Number(book.totalCopiesSold).toLocaleString('en-IN')
      : '—';
  const pubDateLabel = book.publicationDate
    ? formatDate(book.publicationDate)
    : 'Not yet published';

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-semibold text-slate-900">{book.title}</div>
        <div className="text-xs text-slate-500">
          {book.genre || 'General'} • {pubDateLabel}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-700">
        {book.isbn || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
            isProduction
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {book.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-700 font-medium">
        {formatCurrency(book.mrp)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-700">
        {formattedCopies}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-700 font-medium">
        {formatCurrency(book.totalRoyaltyEarned)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600">
        {formatCurrency(book.royaltyPaid)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
        <div className="font-semibold text-slate-900">
          {formatCurrency(book.royaltyPending)}
        </div>
        {isPendingRollover && (
          <div className="text-[10px] text-amber-600 font-medium">Rolls over</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
        <Link
          to={`/submit?bookId=${book.id}`}
          className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-800"
        >
          Ask Help <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </td>
    </tr>
  );
}

