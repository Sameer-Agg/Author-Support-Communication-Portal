import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../api/client.js';
import { BookOpen } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { AlertBanner } from '../../components/common/AlertBanner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { BookStatsCards } from '../../components/author/BookStatsCards.jsx';
import { RolloverNotice } from '../../components/author/RolloverNotice.jsx';
import { BookTable } from '../../components/author/BookTable.jsx';

export function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadBooks() {
      try {
        setLoading(true);
        const data = await apiRequest('/books');
        if (mounted) setBooks(data.books || []);
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load books');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadBooks();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    return books.reduce(
      (acc, b) => ({
        totalEarned: acc.totalEarned + (Number(b.totalRoyaltyEarned) || 0),
        totalPaid: acc.totalPaid + (Number(b.royaltyPaid) || 0),
        totalPending: acc.totalPending + (Number(b.royaltyPending) || 0),
        totalCopies: acc.totalCopies + (Number(b.totalCopiesSold) || 0),
      }),
      { totalEarned: 0, totalPaid: 0, totalPending: 0, totalCopies: 0 }
    );
  }, [books]);

  const hasPendingUnderThreshold = useMemo(() => {
    return books.some(
      (b) => Number(b.royaltyPending) > 0 && Number(b.royaltyPending) < 1000
    );
  }, [books]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-lg border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return <AlertBanner message={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Published Titles"
        subtitle="Overview of your published catalog, circulation figures, and accumulated royalties."
      >
        <Link
          to="/submit"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
        >
          Submit Query
        </Link>
      </PageHeader>

      <BookStatsCards stats={stats} />

      {hasPendingUnderThreshold && <RolloverNotice />}

      {books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books found"
          description="There are currently no catalog entries associated with your author account."
        />
      ) : (
        <BookTable books={books} />
      )}
    </div>
  );
}
