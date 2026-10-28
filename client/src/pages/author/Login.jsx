import { useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { KeyRound, Mail, ArrowRight } from 'lucide-react';
import { AlertBanner } from '../../components/common/AlertBanner.jsx';
import { DemoCredentials } from '../../components/author/DemoCredentials.jsx';

export function Login() {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
  }, []);

  const handleDemoAuthorClick = useCallback(() => {
    setEmail(import.meta.env.VITE_DEMO_AUTHOR_EMAIL || 'priya.sharma@email.com');
    setPassword(import.meta.env.VITE_DEMO_AUTHOR_PASSWORD || 'Author@123');
    setError('');
  }, []);

  const handleDemoAdminClick = useCallback(() => {
    setEmail(import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@bookleaf.in');
    setPassword(import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'Admin@123');
    setError('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin/queue');
      } else {
        navigate('/books');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/queue' : '/books'} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Book<span className="text-emerald-600">Leaf</span>
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Author Support & Communication Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <AlertBanner message={error} />

            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-slate-900"
                  placeholder="author@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-slate-900"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
              {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          </form>

          <DemoCredentials
            onSelectAuthor={handleDemoAuthorClick}
            onSelectAdmin={handleDemoAdminClick}
          />
        </div>
      </div>
    </div>
  );
}
