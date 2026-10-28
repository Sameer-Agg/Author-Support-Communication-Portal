import { BookRow } from './BookRow.jsx';

export function BookTable({ books }) {
  return (
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
            {books.map((book) => (
              <BookRow key={book.id} book={book} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

