import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

export async function getBooks(user, filters = {}) {
  const params = [];
  const conditions = [];

  if (user.role === 'author') {
    params.push(user.id);
    conditions.push(`b.author_id = $${params.length}`);
  } else if (filters.authorId) {
    params.push(Number(filters.authorId));
    conditions.push(`b.author_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      b.id,
      b.book_code AS "bookCode",
      b.author_id AS "authorId",
      u.name AS "authorName",
      b.title,
      b.isbn,
      b.genre,
      b.publication_date AS "publicationDate",
      b.status,
      b.mrp,
      b.author_royalty_per_copy AS "authorRoyaltyPerCopy",
      b.total_copies_sold AS "totalCopiesSold",
      b.total_royalty_earned AS "totalRoyaltyEarned",
      b.royalty_paid AS "royaltyPaid",
      b.royalty_pending AS "royaltyPending",
      b.last_royalty_payout_date AS "lastRoyaltyPayoutDate",
      b.print_partner AS "printPartner",
      b.available_on AS "availableOn",
      b.created_at AS "createdAt"
    FROM books b
    JOIN users u ON b.author_id = u.id
    ${whereClause}
    ORDER BY b.id ASC
  `;

  const res = await pool.query(query, params);
  return res.rows;
}

export async function getBookById(user, bookId) {
  const query = `
    SELECT 
      b.id,
      b.book_code AS "bookCode",
      b.author_id AS "authorId",
      u.name AS "authorName",
      b.title,
      b.isbn,
      b.genre,
      b.publication_date AS "publicationDate",
      b.status,
      b.mrp,
      b.author_royalty_per_copy AS "authorRoyaltyPerCopy",
      b.total_copies_sold AS "totalCopiesSold",
      b.total_royalty_earned AS "totalRoyaltyEarned",
      b.royalty_paid AS "royaltyPaid",
      b.royalty_pending AS "royaltyPending",
      b.last_royalty_payout_date AS "lastRoyaltyPayoutDate",
      b.print_partner AS "printPartner",
      b.available_on AS "availableOn",
      b.created_at AS "createdAt"
    FROM books b
    JOIN users u ON b.author_id = u.id
    WHERE b.id = $1
  `;

  const res = await pool.query(query, [bookId]);
  if (res.rows.length === 0) {
    throw new AppError('Book not found', 404, 'NOT_FOUND');
  }

  const book = res.rows[0];
  if (user.role === 'author' && book.authorId !== user.id) {
    throw new AppError('Book not found', 404, 'NOT_FOUND');
  }

  return book;
}
