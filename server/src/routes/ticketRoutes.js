import { Router } from 'express';
import { z } from 'zod';
import * as ticketController from '../controllers/ticketController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ticketCreationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const createTicketSchema = z.object({
  body: z.object({
    bookId: z.coerce.number().positive().nullable().optional(),
    subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(255),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
    attachmentName: z.string().trim().max(255).optional().nullable(),
  }),
});

const getTicketsSchema = z.object({
  query: z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    category: z.enum([
      'royalty_payments',
      'isbn_metadata',
      'printing_quality',
      'distribution_availability',
      'book_status_production',
      'general_inquiry',
    ]).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    assignedTo: z.string().optional(),
    q: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().positive().optional(),
    limit: z.coerce.number().positive().optional(),
  }),
});

const ticketIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
});

const addMessageSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    body: z.string().trim().min(1, 'Message body is required').max(5000),
  }),
});

const updateTicketSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    category: z.enum([
      'royalty_payments',
      'isbn_metadata',
      'printing_quality',
      'distribution_availability',
      'book_status_production',
      'general_inquiry',
    ]).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    assignedTo: z.coerce.number().nullable().optional(),
  }),
});

const addNoteSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    note: z.string().trim().min(1, 'Note text is required').max(5000),
  }),
});

router.use(authenticateToken);

router.post(
  '/',
  requireRole('author'),
  ticketCreationLimiter,
  validate(createTicketSchema),
  ticketController.createTicket
);

router.get('/', validate(getTicketsSchema), ticketController.getTickets);
router.get('/:id', validate(ticketIdParamSchema), ticketController.getTicketById);
router.post('/:id/messages', validate(addMessageSchema), ticketController.addMessage);

router.patch(
  '/:id',
  requireRole('admin'),
  validate(updateTicketSchema),
  ticketController.updateTicket
);

router.get(
  '/:id/notes',
  requireRole('admin'),
  validate(ticketIdParamSchema),
  ticketController.getInternalNotes
);

router.post(
  '/:id/notes',
  requireRole('admin'),
  validate(addNoteSchema),
  ticketController.addInternalNote
);

router.post(
  '/:id/draft',
  requireRole('admin'),
  validate(ticketIdParamSchema),
  ticketController.getDraft
);

router.post(
  '/:id/reclassify',
  requireRole('admin'),
  validate(ticketIdParamSchema),
  ticketController.reclassify
);

export default router;
