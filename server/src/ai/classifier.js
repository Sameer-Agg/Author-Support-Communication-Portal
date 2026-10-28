import { z } from 'zod';
import { pool } from '../config/db.js';
import { executeAIRequest } from './providers/index.js';
import { buildClassifierPrompt } from './prompts/classifierPrompt.js';
import { applyGuardrails, fallbackKeywordClassifier } from './rules/guardrails.js';
import { emitAIClassified } from '../sockets/socketManager.js';

const aiClassificationSchema = z.object({
  category: z.enum([
    'royalty_payments',
    'isbn_metadata',
    'printing_quality',
    'distribution_availability',
    'book_status_production',
    'general_inquiry',
  ]),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  reason: z.string().min(1),
});

export async function classifyTicket(ticketId) {
  const ticketRes = await pool.query(
    `SELECT id, subject, description, attachment_name, category_source, priority_source 
     FROM tickets 
     WHERE id = $1`,
    [ticketId]
  );

  if (ticketRes.rows.length === 0) return null;
  const ticket = ticketRes.rows[0];

  let classifiedCategory = 'general_inquiry';
  let classifiedPriority = 'medium';
  let classifiedReason = 'Default inquiry status assigned.';
  let aiStatus = 'done';
  let source = 'ai';

  try {
    const { system, messages } = buildClassifierPrompt(
      ticket.subject,
      ticket.description,
      ticket.attachment_name
    );
    const aiResult = await executeAIRequest({
      system,
      messages,
      temperature: 0.1,
      maxTokens: 250,
      responseFormat: 'json',
    });

    let rawJsonText = aiResult.text.trim();
    if (rawJsonText.startsWith('```')) {
      rawJsonText = rawJsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    const parsedJson = JSON.parse(rawJsonText);
    const validated = aiClassificationSchema.parse(parsedJson);

    const guarded = applyGuardrails(
      validated.category,
      validated.priority,
      ticket.subject,
      ticket.description
    );

    classifiedCategory = guarded.category;
    classifiedPriority = guarded.priority;
    classifiedReason = validated.reason;
  } catch (err) {
    const fallback = fallbackKeywordClassifier(ticket.subject, ticket.description);
    const guarded = applyGuardrails(
      fallback.category,
      fallback.priority,
      ticket.subject,
      ticket.description
    );
    classifiedCategory = guarded.category;
    classifiedPriority = guarded.priority;
    classifiedReason = fallback.reason;
    aiStatus = 'failed';
    source = 'default';
  }

  const updateFields = ['ai_status = $1', 'ai_reason = $2', 'updated_at = NOW()'];
  const updateParams = [aiStatus, classifiedReason, ticketId];

  if (ticket.category_source !== 'admin') {
    updateParams.push(classifiedCategory);
    updateFields.push(`category = $${updateParams.length}`);
    updateParams.push(source);
    updateFields.push(`category_source = $${updateParams.length}`);
  }

  if (ticket.priority_source !== 'admin') {
    updateParams.push(classifiedPriority);
    updateFields.push(`priority = $${updateParams.length}`);
    updateParams.push(source);
    updateFields.push(`priority_source = $${updateParams.length}`);
  }

  const updateQuery = `
    UPDATE tickets
    SET ${updateFields.join(', ')}
    WHERE id = $3
    RETURNING *
  `;

  const updatedTicketRes = await pool.query(updateQuery, updateParams);
  const updatedTicket = updatedTicketRes.rows[0];

  emitAIClassified(updatedTicket);

  return updatedTicket;
}

export function queueTicketClassification(ticketId) {
  setImmediate(() => {
    classifyTicket(ticketId).catch((err) => {
      console.error('Asynchronous classification error for ticket', ticketId, err.message);
    });
  });
}

