import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function DefaultRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin/queue" replace />;
  }

  return <Navigate to="/books" replace />;
}

