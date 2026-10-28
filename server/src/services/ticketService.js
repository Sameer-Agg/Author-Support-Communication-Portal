import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import {
  emitTicketCreated,
  emitMessageCreated,
  emitTicketUpdated,
} from '../sockets/socketManager.js';
import { queueTicketClassification, classifyTicket } from '../ai/classifier.js';
import { generateDraft as drafterGenerateDraft } from '../ai/drafter.js';

const ALLOWED_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const ALLOWED_CATEGORIES = [
  'royalty_payments',
  'isbn_metadata',
  'printing_quality',
  'distribution_availability',
  'book_status_production',
  'general_inquiry',
];
const ALLOWED_PRIORITIES = ['critical', 'high', 'medium', 'low'];

export async function createTicket(user, data) {
  const { bookId, subject, description, attachmentName } = data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let verifiedBookId = null;
    if (bookId) {
      const bookRes = await client.query(
        'SELECT id, author_id FROM books WHERE id = $1',
        [bookId]
      );
      if (bookRes.rows.length === 0 || bookRes.rows[0].author_id !== user.id) {
        throw new AppError('Selected book not found or does not belong to author', 400, 'INVALID_BOOK');
      }
      verifiedBookId = bookRes.rows[0].id;
    }

    const ticketRes = await client.query(
      `INSERT INTO tickets (
        author_id, book_id, subject, description, attachment_name,
        status, category, category_source, priority, priority_source, ai_status
      ) VALUES ($1, $2, $3, $4, $5, 'open', 'general_inquiry', 'pending', 'medium', 'pending', 'pending')
      RETURNING *`,
      [user.id, verifiedBookId, subject.trim(), description.trim(), attachmentName || null]
    );

    const ticket = ticketRes.rows[0];

    await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, body)
       VALUES ($1, $2, $3)`,
      [ticket.id, user.id, description.trim()]
    );

    await client.query('COMMIT');

    emitTicketCreated(ticket);
    queueTicketClassification(ticket.id);

    return ticket;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getTickets(user, options = {}) {
  const {
    status,
    category,
    priority,
    assignedTo,
    q,
    from,
    to,
    page = 1,
    limit = 20,
  } = options;

  const params = [];
  const conditions = [];

  if (user.role === 'author') {
    params.push(user.id);
    conditions.push(`t.author_id = $${params.length}`);
  }

  if (status && ALLOWED_STATUSES.includes(status)) {
    params.push(status);
    conditions.push(`t.status = $${params.length}`);
  }

  if (user.role !== 'author') {
    if (category && ALLOWED_CATEGORIES.includes(category)) {
      params.push(category);
      conditions.push(`t.category = $${params.length}`);
    }
    if (priority && ALLOWED_PRIORITIES.includes(priority)) {
      params.push(priority);
      conditions.push(`t.priority = $${params.length}`);
    }
    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        conditions.push(`t.assigned_to IS NULL`);
      } else if (!isNaN(Number(assignedTo))) {
        params.push(Number(assignedTo));
        conditions.push(`t.assigned_to = $${params.length}`);
      }
    }
    if (from) {
      params.push(new Date(from));
      conditions.push(`t.created_at >= $${params.length}`);
    }
    if (to) {
      params.push(new Date(to));
      conditions.push(`t.created_at <= $${params.length}`);
    }
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      const qIdx = params.length;
      conditions.push(`(
        t.subject ILIKE $${qIdx} OR 
        t.description ILIKE $${qIdx} OR 
        u.name ILIKE $${qIdx} OR 
        b.title ILIKE $${qIdx}
      )`);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM tickets t
    JOIN users u ON t.author_id = u.id
    LEFT JOIN books b ON t.book_id = b.id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  params.push(safeLimit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const dataQuery = `
    SELECT 
      t.id,
      t.author_id AS "authorId",
      u.name AS "authorName",
      u.email AS "authorEmail",
      t.book_id AS "bookId",
      b.title AS "bookTitle",
      b.book_code AS "bookCode",
      t.subject,
      t.description,
      t.attachment_name AS "attachmentName",
      t.status,
      t.category,
      t.category_source AS "categorySource",
      t.priority,
      t.priority_source AS "prioritySource",
      t.ai_status AS "aiStatus",
      t.ai_reason AS "aiReason",
      t.assigned_to AS "assignedTo",
      adm.name AS "assigneeName",
      t.created_at AS "createdAt",
      t.updated_at AS "updatedAt",
      (
        SELECT COUNT(*) 
        FROM ticket_messages tm 
        WHERE tm.ticket_id = t.id
      )::int AS "messageCount"
    FROM tickets t
    JOIN users u ON t.author_id = u.id
    LEFT JOIN books b ON t.book_id = b.id
    LEFT JOIN users adm ON t.assigned_to = adm.id
    ${whereClause}
    ORDER BY 
      CASE WHEN t.status IN ('open', 'in_progress') THEN 0 ELSE 1 END ASC,
      CASE t.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END ASC,
      t.created_at ASC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const dataRes = await pool.query(dataQuery, params);

  return {
    tickets: dataRes.rows,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

export async function getTicketById(user, ticketId) {
  const query = `
    SELECT 
      t.id,
      t.author_id AS "authorId",
      u.name AS "authorName",
      u.email AS "authorEmail",
      u.phone AS "authorPhone",
      u.city AS "authorCity",
      t.book_id AS "bookId",
      b.title AS "bookTitle",
      b.book_code AS "bookCode",
      b.isbn AS "bookIsbn",
      b.status AS "bookStatus",
      b.mrp AS "bookMrp",
      b.royalty_pending AS "bookRoyaltyPending",
      b.publication_date AS "bookPublicationDate",
      b.print_partner AS "bookPrintPartner",
      b.available_on AS "bookAvailableOn",
      t.subject,
      t.description,
      t.attachment_name AS "attachmentName",
      t.status,
      t.category,
      t.category_source AS "categorySource",
      t.priority,
      t.priority_source AS "prioritySource",
      t.ai_status AS "aiStatus",
      t.ai_reason AS "aiReason",
      t.assigned_to AS "assignedTo",
      adm.name AS "assigneeName",
      t.created_at AS "createdAt",
      t.updated_at AS "updatedAt"
    FROM tickets t
    JOIN users u ON t.author_id = u.id
    LEFT JOIN books b ON t.book_id = b.id
    LEFT JOIN users adm ON t.assigned_to = adm.id
    WHERE t.id = $1
  `;

  const ticketRes = await pool.query(query, [ticketId]);
  if (ticketRes.rows.length === 0) {
    throw new AppError('Ticket not found', 404, 'NOT_FOUND');
  }

  const ticket = ticketRes.rows[0];

  if (user.role === 'author' && ticket.authorId !== user.id) {
    throw new AppError('Ticket not found', 404, 'NOT_FOUND');
  }

  const messagesQuery = `
    SELECT 
      tm.id,
      tm.ticket_id AS "ticketId",
      tm.sender_id AS "senderId",
      u.name AS "senderName",
      u.role AS "senderRole",
      tm.body,
      tm.created_at AS "createdAt"
    FROM ticket_messages tm
    JOIN users u ON tm.sender_id = u.id
    WHERE tm.ticket_id = $1
    ORDER BY tm.created_at ASC
  `;
  const messagesRes = await pool.query(messagesQuery, [ticketId]);

  let internalNotes = [];
  let aiDraft = null;

  if (user.role === 'admin') {
    const notesQuery = `
      SELECT 
        inote.id,
        inote.ticket_id AS "ticketId",
        inote.admin_id AS "adminId",
        u.name AS "adminName",
        inote.note,
        inote.created_at AS "createdAt"
      FROM internal_notes inote
      JOIN users u ON inote.admin_id = u.id
      WHERE inote.ticket_id = $1
      ORDER BY inote.created_at ASC
    `;
    const notesRes = await pool.query(notesQuery, [ticketId]);
    internalNotes = notesRes.rows;

    const draftQuery = `
      SELECT id, ticket_id AS "ticketId", draft_text AS "draftText", model, created_at AS "createdAt"
      FROM ai_drafts
      WHERE ticket_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const draftRes = await pool.query(draftQuery, [ticketId]);
    if (draftRes.rows.length > 0) {
      aiDraft = draftRes.rows[0];
    }
  }

  if (user.role === 'author') {
    return {
      id: ticket.id,
      bookId: ticket.bookId,
      bookTitle: ticket.bookTitle,
      subject: ticket.subject,
      description: ticket.description,
      attachmentName: ticket.attachmentName,
      status: ticket.status,
      category: ticket.category,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      messages: messagesRes.rows,
    };
  }

  return {
    ...ticket,
    messages: messagesRes.rows,
    internalNotes,
    aiDraft,
  };
}

export async function addMessage(user, ticketId, body) {
  const ticketRes = await pool.query(
    'SELECT id, author_id, status FROM tickets WHERE id = $1',
    [ticketId]
  );
  if (ticketRes.rows.length === 0) {
    throw new AppError('Ticket not found', 404, 'NOT_FOUND');
  }

  const ticket = ticketRes.rows[0];
  if (user.role === 'author' && ticket.author_id !== user.id) {
    throw new AppError('Ticket not found', 404, 'NOT_FOUND');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const msgRes = await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, ticket_id AS "ticketId", sender_id AS "senderId", body, created_at AS "createdAt"`,
      [ticketId, user.id, body.trim()]
    );

    if (user.role === 'author' && (ticket.status === 'resolved' || ticket.status === 'closed')) {
      await client.query(
        "UPDATE tickets SET status = 'in_progress', updated_at = NOW() WHERE id = $1",
        [ticketId]
      );
    } else {
      await client.query('UPDATE tickets SET updated_at = NOW() WHERE id = $1', [ticketId]);
    }

    await client.query('COMMIT');

    const message = {
      ...msgRes.rows[0],
      senderName: user.name,
      senderRole: user.role,
    };

    emitMessageCreated(ticketId, ticket.author_id, message);

    return message;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateTicket(adminUser, ticketId, updates) {
  const ticketRes = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
  if (ticketRes.rows.length === 0) {
    throw new AppError('Ticket not found', 404, 'NOT_FOUND');
  }

  const current = ticketRes.rows[0];
  const fields = [];
  const params = [ticketId];

  if (updates.status && ALLOWED_STATUSES.includes(updates.status)) {
    params.push(updates.status);
    fields.push(`status = $${params.length}`);
  }

  if (updates.category && ALLOWED_CATEGORIES.includes(updates.category)) {
    params.push(updates.category);
    fields.push(`category = $${params.length}`);
    fields.push(`category_source = 'admin'`);
  }

  if (updates.priority && ALLOWED_PRIORITIES.includes(updates.priority)) {
    params.push(updates.priority);
    fields.push(`priority = $${params.length}`);
    fields.push(`priority_source = 'admin'`);
  }

  if (updates.assignedTo !== undefined) {
    if (updates.assignedTo === null || updates.assignedTo === 0) {
      fields.push(`assigned_to = NULL`);
    } else {
      const adminCheck = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND role = 'admin'",
        [updates.assignedTo]
      );
      if (adminCheck.rows.length === 0) {
        throw new AppError('Assignee must be an active admin', 400, 'INVALID_ASSIGNEE');
      }
      params.push(updates.assignedTo);
      fields.push(`assigned_to = $${params.length}`);
    }
  }

  if (fields.length === 0) {
    return current;
  }

  fields.push('updated_at = NOW()');

  const query = `
    UPDATE tickets 
    SET ${fields.join(', ')}
    WHERE id = $1
    RETURNING *
  `;

  const updatedRes = await pool.query(query, params);
  const updated = updatedRes.rows[0];

  emitTicketUpdated(updated.author_id, updated);

  return updated;
}

export async function getInternalNotes(ticketId) {
  const ticketCheck = await pool.query('SELECT id FROM tickets WHERE id = $1', [ticketId]);
  if (ticketCheck.rows.length === 0) {
    throw new AppError('Ticket not found', 404, 'NOT_FOUND');
  }

  const query = `
    SELECT 
      inote.id,
      inote.ticket_id AS "ticketId",
      inote.admin_id AS "adminId",
      u.name AS "adminName",
      inote.note,
      inote.created_at AS "createdAt"
    FROM internal_notes inote
    JOIN users u ON inote.admin_id = u.id
    WHERE inote.ticket_id = $1
    ORDER BY inote.created_at ASC
  `;

  const res = await pool.query(query, [ticketId]);
  return res.rows;
}

export async function addInternalNote(adminUser, ticketId, note) {
  const ticketCheck = await pool.query('SELECT id FROM tickets WHERE id = $1', [ticketId]);
  if (ticketCheck.rows.length === 0) {
    throw new AppError('Ticket not found', 404, 'NOT_FOUND');
  }

  const res = await pool.query(
    `INSERT INTO internal_notes (ticket_id, admin_id, note)
     VALUES ($1, $2, $3)
     RETURNING id, ticket_id AS "ticketId", admin_id AS "adminId", note, created_at AS "createdAt"`,
    [ticketId, adminUser.id, note.trim()]
  );

  return {
    ...res.rows[0],
    adminName: adminUser.name,
  };
}

export async function generateDraft(ticketId, forceRegenerate = false) {
  return await drafterGenerateDraft(ticketId, forceRegenerate);
}

export async function reclassifyTicket(ticketId) {
  return await classifyTicket(ticketId);
}
