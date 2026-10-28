import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { BookOpen, AlertCircle, ArrowUpRight, HelpCircle } from 'lucide-react';

export function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true);
        const data = await apiRequest('/books');
        setBooks(data.books || []);
      } catch (err) {
        setError(err.message || 'Failed to load books');
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-white rounded-lg border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const hasPendingUnderThreshold = books.some(
    (b) => Number(b.royaltyPending) > 0 && Number(b.royaltyPending) < 1000
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Published Titles</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your published catalog, circulation figures, and accumulated royalties.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
          >
            Submit Query
          </Link>
        </div>
      </div>

      {hasPendingUnderThreshold && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start space-x-3">
          <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-900">Quarterly Payout Threshold Policy</div>
            <p className="mt-0.5 text-amber-700">
              Royalties below the ₹1,000 threshold roll over to subsequent quarters until cumulative earnings reach ₹1,000.
            </p>
          </div>
        </div>
      )}

      {books.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-900">No books found</h3>
          <p className="mt-1 text-sm text-slate-500">
            There are currently no catalog entries associated with your author account.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Title & Genre
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    ISBN
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    MRP
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Copies Sold
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Earned
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Paid
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Pending
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {books.map((book) => {
                  const isPendingRollover =
                    Number(book.royaltyPending) > 0 && Number(book.royaltyPending) < 1000;
                  const isProduction = !book.publicationDate || book.status.toLowerCase().includes('production');

                  return (
                    <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{book.title}</div>
                        <div className="text-xs text-slate-500">
                          {book.genre || 'General'} • {book.publicationDate ? formatDate(book.publicationDate) : 'Not yet published'}
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
                        {book.totalCopiesSold !== null && book.totalCopiesSold !== undefined
                          ? Number(book.totalCopiesSold).toLocaleString('en-IN')
                          : '—'}
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
                          <div className="text-[10px] text-amber-600 font-medium">
                            Rolls over
                          </div>
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

