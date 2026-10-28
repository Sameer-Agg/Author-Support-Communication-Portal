import * as ticketService from '../services/ticketService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.user, req.body);
  res.status(201).json({ ticket });
});

export const getTickets = asyncHandler(async (req, res) => {
  const result = await ticketService.getTickets(req.user, req.query);
  res.status(200).json(result);
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.user, Number(req.params.id));
  res.status(200).json({ ticket });
});

export const addMessage = asyncHandler(async (req, res) => {
  const message = await ticketService.addMessage(
    req.user,
    Number(req.params.id),
    req.body.body
  );
  res.status(201).json({ message });
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicket(
    req.user,
    Number(req.params.id),
    req.body
  );
  res.status(200).json({ ticket });
});

export const getInternalNotes = asyncHandler(async (req, res) => {
  const notes = await ticketService.getInternalNotes(Number(req.params.id));
  res.status(200).json({ notes });
});

export const addInternalNote = asyncHandler(async (req, res) => {
  const note = await ticketService.addInternalNote(
    req.user,
    Number(req.params.id),
    req.body.note
  );
  res.status(201).json({ note });
});

export const getDraft = asyncHandler(async (req, res) => {
  const draft = await ticketService.generateDraft(
    Number(req.params.id),
    req.query.regenerate === 'true'
  );
  res.status(200).json({ draft });
});

export const reclassify = asyncHandler(async (req, res) => {
  const ticket = await ticketService.reclassifyTicket(Number(req.params.id));
  res.status(200).json({ ticket });
});
