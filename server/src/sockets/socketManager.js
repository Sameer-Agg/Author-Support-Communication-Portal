import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';

let ioInstance = null;

export function initSocketManager(io) {
  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, env.JWT_SECRET);
      } catch (err) {
        return next(new Error('Invalid token'));
      }

      const userRes = await pool.query('SELECT id, name, role FROM users WHERE id = $1', [decoded.id]);
      if (userRes.rows.length === 0) {
        return next(new Error('User not found'));
      }

      const user = userRes.rows[0];
      socket.user = {
        id: user.id,
        name: user.name,
        role: user.role,
      };

      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);

    if (socket.user.role === 'admin') {
      socket.join('admins');
    }

    socket.on('disconnect', () => {});
  });
}

export function emitTicketCreated(ticket) {
  if (!ioInstance) return;
  ioInstance.to('admins').emit('ticket:created', {
    id: ticket.id,
    authorId: ticket.author_id,
    bookId: ticket.book_id,
    subject: ticket.subject,
    status: ticket.status,
    category: ticket.category,
    priority: ticket.priority,
    createdAt: ticket.created_at,
  });
}

export function emitMessageCreated(ticketId, authorId, message) {
  if (!ioInstance) return;
  const payload = {
    ticketId,
    message: {
      id: message.id,
      ticketId: message.ticketId || ticketId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      body: message.body,
      createdAt: message.createdAt,
    },
  };

  ioInstance.to('admins').emit('message:new', payload);
  ioInstance.to(`user:${authorId}`).emit('message:new', payload);
  ioInstance.to('admins').emit('message:created', payload);
  ioInstance.to(`user:${authorId}`).emit('message:created', payload);
}

export function emitTicketUpdated(authorId, ticket) {
  if (!ioInstance) return;

  ioInstance.to('admins').emit('ticket:updated', {
    id: ticket.id,
    authorId: ticket.author_id,
    status: ticket.status,
    category: ticket.category,
    categorySource: ticket.category_source,
    priority: ticket.priority,
    prioritySource: ticket.priority_source,
    assignedTo: ticket.assigned_to,
    updatedAt: ticket.updated_at,
  });

  ioInstance.to(`user:${authorId}`).emit('ticket:updated', {
    id: ticket.id,
    status: ticket.status,
    category: ticket.category,
    updatedAt: ticket.updated_at,
  });
}

export function emitAIClassified(ticket) {
  if (!ioInstance) return;
  ioInstance.to('admins').emit('ai:classified', {
    ticketId: ticket.id,
    category: ticket.category,
    priority: ticket.priority,
    aiStatus: ticket.ai_status,
    aiReason: ticket.ai_reason,
  });
}

