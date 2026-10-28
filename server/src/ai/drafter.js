import { pool } from '../config/db.js';
import { executeAIRequest } from './providers/index.js';
import { getKBContextForCategory } from './knowledgeBase/index.js';
import { buildDrafterPrompt } from './prompts/drafterPrompt.js';
import { AppError } from '../utils/AppError.js';

export function computeRoyaltyPayoutSchedule(refDate = new Date()) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();

  let nextQuarterName = 'Q1';
  let nextPayoutDate = new Date(year, 4, 15);

  if (month < 3) {
    nextQuarterName = 'Q1';
    nextPayoutDate = new Date(year, 4, 15);
  } else if (month < 6) {
    nextQuarterName = 'Q2';
    nextPayoutDate = new Date(year, 7, 15);
  } else if (month < 9) {
    nextQuarterName = 'Q3';
    nextPayoutDate = new Date(year, 10, 15);
  } else {
    nextQuarterName = 'Q4';
    nextPayoutDate = new Date(year + 1, 1, 15);
  }

  const formattedDate = nextPayoutDate.toISOString().split('T')[0];
  return { nextQuarterName, nextPayoutDate: formattedDate };
}

export async function generateDraft(ticketId, forceRegenerate = false) {
  const ticketRes = await pool.query(
    `SELECT 
      t.id, t.author_id, t.book_id, t.subject, t.description, t.category, t.status, t.attachment_name,
      u.name AS author_name, u.email AS author_email,
      b.title AS book_title, b.isbn AS book_isbn, b.status AS book_status,
      b.mrp AS book_mrp, b.total_copies_sold, b.total_royalty_earned,
      b.royalty_paid, b.royalty_pending, b.last_royalty_payout_date,
      b.print_partner, b.available_on
    FROM tickets t
    JOIN users u ON t.author_id = u.id
    LEFT JOIN books b ON t.book_id = b.id
    WHERE t.id = $1`,
    [ticketId]
  );

  if (ticketRes.rows.length === 0) {
    throw new AppError('Ticket not found', 404, 'NOT_FOUND');
  }

  const ticket = ticketRes.rows[0];

  if (!forceRegenerate) {
    const cachedDraftRes = await pool.query(
      `SELECT id, ticket_id AS "ticketId", draft_text AS "draftText", model, created_at AS "createdAt"
       FROM ai_drafts
       WHERE ticket_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [ticketId]
    );

    if (cachedDraftRes.rows.length > 0) {
      return cachedDraftRes.rows[0];
    }
  }

  const messagesRes = await pool.query(
    `SELECT tm.id, tm.body, tm.created_at, u.name AS "senderName", u.role AS "senderRole"
     FROM ticket_messages tm
     JOIN users u ON tm.sender_id = u.id
     WHERE tm.ticket_id = $1
     ORDER BY tm.created_at ASC`,
    [ticketId]
  );

  const schedule = computeRoyaltyPayoutSchedule();
  const pendingRoyaltyAmount = Number(ticket.royalty_pending || 0);
  const isPendingUnderThreshold = pendingRoyaltyAmount > 0 && pendingRoyaltyAmount < 1000;

  const computedFacts = {
    nextPayoutDate: schedule.nextPayoutDate,
    nextQuarter: schedule.nextQuarterName,
    pendingRoyalty: pendingRoyaltyAmount,
    isPendingUnderThreshold,
    productionStage: ticket.book_status || 'Account level / Not linked to specific production',
  };

  const bookFacts = ticket.book_id
    ? {
        title: ticket.book_title,
        isbn: ticket.book_isbn,
        status: ticket.book_status,
        mrp: ticket.book_mrp,
        totalCopiesSold: ticket.total_copies_sold,
        totalRoyaltyEarned: ticket.total_royalty_earned,
        royaltyPaid: ticket.royalty_paid,
        royaltyPending: ticket.royalty_pending,
        printPartner: ticket.print_partner,
        availableOn: ticket.available_on,
      }
    : null;

  const kbContext = getKBContextForCategory(ticket.category);

  const { system, messages } = buildDrafterPrompt({
    authorName: ticket.author_name,
    kbContext,
    computedFacts,
    bookFacts,
    subject: ticket.subject,
    description: ticket.description,
    attachmentName: ticket.attachment_name,
    recentMessages: messagesRes.rows,
  });

  const aiResult = await executeAIRequest({
    system,
    messages,
    temperature: 0.3,
    maxTokens: 1000,
  });

  const draftText = aiResult.text.trim();

  const insertDraftRes = await pool.query(
    `INSERT INTO ai_drafts (ticket_id, draft_text, model, tokens_used)
     VALUES ($1, $2, $3, $4)
     RETURNING id, ticket_id AS "ticketId", draft_text AS "draftText", model, created_at AS "createdAt"`,
    [ticketId, draftText, aiResult.model, aiResult.usage?.totalTokens || null]
  );

  return insertDraftRes.rows[0];
}

