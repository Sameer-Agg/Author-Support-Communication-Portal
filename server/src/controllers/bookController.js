import * as bookService from '../services/bookService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getBooks = asyncHandler(async (req, res) => {
  const books = await bookService.getBooks(req.user, req.query);
  res.status(200).json({ books });
});

export const getBookById = asyncHandler(async (req, res) => {
  const book = await bookService.getBookById(req.user, Number(req.params.id));
  res.status(200).json({ book });
});
