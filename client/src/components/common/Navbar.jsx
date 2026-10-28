import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { BookOpen, LifeBuoy, PlusCircle, LogOut, ShieldAlert } from 'lucide-react';

const AUTHOR_NAV_ITEMS = [
  { label: 'My Books', path: '/books', icon: BookOpen },
  { label: 'My Tickets', path: '/tickets', icon: LifeBuoy },
  { label: 'Submit Query', path: '/submit', icon: PlusCircle },
];

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { connected } = useSocket();
  const location = useLocation();

  const brandPath = isAdmin ? '/admin/queue' : '/books';
  const roleBadgeText = user?.role === 'admin' ? 'Admin Portal' : 'Author Portal';
  const connectionTitle = connected ? 'Live real-time updates active' : 'Connecting to real-time service';
  const connectionLabel = connected ? 'Live' : 'Connecting';
  const userSubtitle = user?.authorCode ? `Code: ${user.authorCode}` : user?.email;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to={brandPath} className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Book<span className="text-emerald-600">Leaf</span>
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                {roleBadgeText}
              </span>
            </Link>

            {!isAdmin && (
              <nav className="hidden md:flex space-x-1">
                {AUTHOR_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const navClass = isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50';

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${navClass}`}
                    >
                      <Icon className="w-4 h-4 mr-2 text-slate-500" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {isAdmin && (
              <nav className="hidden md:flex space-x-1">
                <Link
                  to="/admin/queue"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 mr-2 text-slate-500" />
                  Support Queue
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center text-xs text-slate-500" title={connectionTitle}>
              <span
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  connected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="hidden sm:inline">{connectionLabel}</span>
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-900">{user?.name}</div>
              <div className="text-xs text-slate-500">{userSubtitle}</div>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
