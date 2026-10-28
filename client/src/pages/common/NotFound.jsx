import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const homePath = !isAuthenticated
    ? '/login'
    : user?.role === 'admin'
    ? '/admin/queue'
    : '/books';

  const homeLabel = !isAuthenticated
    ? 'Go to Sign In'
    : user?.role === 'admin'
    ? 'Admin Queue'
    : 'My Books Catalog';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
          <FileQuestion className="w-8 h-8 text-emerald-600" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Error 404
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
            Page Not Found
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            The page you are looking for doesn't exist, was removed, or you don't have access to it.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Go Back
          </button>
          <Link
            to={homePath}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors"
          >
            <Home className="w-4 h-4 mr-1.5" />
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

