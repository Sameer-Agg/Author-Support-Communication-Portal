import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { AdminRoute } from './routes/AdminRoute.jsx';
import { Login } from './pages/author/Login.jsx';
import { Books } from './pages/author/Books.jsx';
import { SubmitQuery } from './pages/author/SubmitQuery.jsx';
import { MyTickets } from './pages/author/MyTickets.jsx';
import { TicketDetail } from './pages/author/TicketDetail.jsx';
import { AdminQueue } from './pages/admin/AdminQueue.jsx';
import { AdminTicketDetail } from './pages/admin/AdminTicketDetail.jsx';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/books" replace />} />
            <Route path="/books" element={<Books />} />
            <Route path="/submit" element={<SubmitQuery />} />
            <Route path="/tickets" element={<MyTickets />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Route>

          <Route path="/admin" element={<AdminRoute />}>
            <Route path="queue" element={<AdminQueue />} />
            <Route path="tickets/:id" element={<AdminTicketDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/books" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}
