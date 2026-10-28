import { BookRow } from './BookRow.jsx';
import { BOOK_TABLE_COLUMNS } from '../../utils/constants.js';

export function BookTable({ books }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {BOOK_TABLE_COLUMNS.map((col) => (
                <th
                  key={col.label}
                  scope="col"
                  className={`px-6 py-3.5 text-${col.align} text-xs font-semibold text-slate-600 uppercase tracking-wider`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {books.map((book) => (
              <BookRow key={book.id} book={book} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
