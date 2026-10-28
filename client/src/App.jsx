import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { AdminRoute } from './routes/AdminRoute.jsx';
import { DefaultRedirect } from './routes/DefaultRedirect.jsx';
import { LoadingSpinner } from './components/common/LoadingSpinner.jsx';

const Login = lazy(() => import('./pages/author/Login.jsx').then((m) => ({ default: m.Login })));
const Books = lazy(() => import('./pages/author/Books.jsx').then((m) => ({ default: m.Books })));
const SubmitQuery = lazy(() => import('./pages/author/SubmitQuery.jsx').then((m) => ({ default: m.SubmitQuery })));
const MyTickets = lazy(() => import('./pages/author/MyTickets.jsx').then((m) => ({ default: m.MyTickets })));
const TicketDetail = lazy(() => import('./pages/author/TicketDetail.jsx').then((m) => ({ default: m.TicketDetail })));
const AdminQueue = lazy(() => import('./pages/admin/AdminQueue.jsx').then((m) => ({ default: m.AdminQueue })));
const AdminTicketDetail = lazy(() => import('./pages/admin/AdminTicketDetail.jsx').then((m) => ({ default: m.AdminTicketDetail })));
const NotFound = lazy(() => import('./pages/common/NotFound.jsx').then((m) => ({ default: m.NotFound })));

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<DefaultRedirect />} />
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/books" element={<Books />} />
              <Route path="/submit" element={<SubmitQuery />} />
              <Route path="/tickets" element={<MyTickets />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
            </Route>

            <Route path="/admin" element={<AdminRoute />}>
              <Route index element={<Navigate to="queue" replace />} />
              <Route path="queue" element={<AdminQueue />} />
              <Route path="tickets/:id" element={<AdminTicketDetail />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </SocketProvider>
    </AuthProvider>
  );
}
