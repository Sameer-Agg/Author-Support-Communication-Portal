import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('Starting database seeding...');
    await client.query('BEGIN');

    console.log('Clearing existing records...');
    await client.query(`
      TRUNCATE TABLE 
        ai_drafts,
        internal_notes,
        ticket_messages,
        tickets,
        books,
        users
      RESTART IDENTITY CASCADE;
    `);

    const saltRounds = 10;
    const authorPasswordHash = await bcrypt.hash(env.DEMO_AUTHOR_PASSWORD, saltRounds);
    const adminPasswordHash = await bcrypt.hash(env.DEMO_ADMIN_PASSWORD, saltRounds);

    console.log('Creating admin accounts...');
    const adminAccounts = [
      {
        name: 'BookLeaf Admin',
        email: 'admin@bookleaf.in',
        role: 'admin',
        phone: '+91-11-23456789',
        city: 'Delhi',
      },
      {
        name: 'Operations Specialist',
        email: 'ops@bookleaf.in',
        role: 'admin',
        phone: '+91-11-98765432',
        city: 'Delhi',
      },
    ];

    for (const adm of adminAccounts) {
      await client.query(
        `INSERT INTO users (name, email, role, phone, city, password_hash, joined_date)
         VALUES ($1, LOWER($2), $3, $4, $5, $6, CURRENT_DATE)`,
        [adm.name, adm.email, adm.role, adm.phone, adm.city, adminPasswordHash]
      );
    }

    const sampleDataPath = path.resolve(__dirname, '../../data/bookleaf_sample_data.json');
    if (!fs.existsSync(sampleDataPath)) {
      throw new Error(`Sample data file not found at ${sampleDataPath}`);
    }

    const rawData = fs.readFileSync(sampleDataPath, 'utf-8');
    const { authors } = JSON.parse(rawData);

    console.log(`Processing ${authors.length} authors from sample dataset...`);

    let totalBooksInserted = 0;

    for (const author of authors) {
      const authorRes = await client.query(
        `INSERT INTO users (author_code, name, email, phone, city, role, password_hash, joined_date)
         VALUES ($1, $2, LOWER($3), $4, $5, 'author', $6, $7)
         RETURNING id`,
        [
          author.author_id,
          author.name,
          author.email,
          author.phone,
          author.city,
          authorPasswordHash,
          author.joined_date,
        ]
      );

      const authorDbId = authorRes.rows[0].id;

      for (const book of author.books) {
        await client.query(
          `INSERT INTO books (
            book_code,
            author_id,
            title,
            isbn,
            genre,
            publication_date,
            status,
            mrp,
            author_royalty_per_copy,
            total_copies_sold,
            total_royalty_earned,
            royalty_paid,
            royalty_pending,
            last_royalty_payout_date,
            print_partner,
            available_on
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            book.book_id,
            authorDbId,
            book.title,
            book.isbn,
            book.genre,
            book.publication_date || null,
            book.status,
            book.mrp ?? null,
            book.author_royalty_per_copy ?? null,
            book.total_copies_sold || 0,
            book.total_royalty_earned || 0,
            book.royalty_paid || 0,
            book.royalty_pending || 0,
            book.last_royalty_payout_date || null,
            book.print_partner || null,
            book.available_on || [],
          ]
        );
        totalBooksInserted++;
      }
    }

    console.log('Seeding initial sample support tickets...');
    const priyaUser = await client.query(`SELECT id FROM users WHERE author_code = 'AUTH001'`);
    const priyaBook = await client.query(`SELECT id FROM books WHERE book_code = 'BK001'`);
    const adminUser = await client.query(`SELECT id FROM users WHERE email = 'admin@bookleaf.in'`);

    if (priyaUser.rows.length && priyaBook.rows.length && adminUser.rows.length) {
      const pId = priyaUser.rows[0].id;
      const bId = priyaBook.rows[0].id;
      const aId = adminUser.rows[0].id;

      const t1 = await client.query(
        `INSERT INTO tickets (
          author_id, book_id, subject, description, status, category,
          category_source, priority, priority_source, ai_status, ai_reason, assigned_to
        ) VALUES ($1, $2, $3, $4, 'in_progress', 'royalty_payments', 'ai', 'high', 'ai', 'done', $5, $6)
        RETURNING id`,
        [
          pId,
          bId,
          'Royalty payout schedule inquiry for Q3',
          'I wanted to check when the Q3 royalty payment for Whispers of the Ganges will be transferred to my bank account.',
          'Author is asking about pending quarterly royalty payout timeline.',
          aId,
        ]
      );

      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_id, body)
         VALUES ($1, $2, $3)`,
        [
          t1.rows[0].id,
          pId,
          'I wanted to check when the Q3 royalty payment for Whispers of the Ganges will be transferred to my bank account.',
        ]
      );

      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_id, body)
         VALUES ($1, $2, $3)`,
        [
          t1.rows[0].id,
          aId,
          'Hello Priya, thank you for reaching out. Per BookLeaf policy, Q3 royalties are calculated quarterly and distributed within 45 days. Your pending balance of ₹3,570 will be processed in the upcoming cycle.',
        ]
      );

      await client.query(
        `INSERT INTO internal_notes (ticket_id, admin_id, note)
         VALUES ($1, $2, 'Bank details verified on author dashboard. Payment scheduled with finance batch #44.')`,
        [t1.rows[0].id, aId]
      );

      const snehaUser = await client.query(`SELECT id FROM users WHERE author_code = 'AUTH007'`);
      const snehaBook = await client.query(`SELECT id FROM books WHERE book_code = 'BK013'`);
      if (snehaUser.rows.length && snehaBook.rows.length) {
        const sId = snehaUser.rows[0].id;
        const sbId = snehaBook.rows[0].id;

        const t2 = await client.query(
          `INSERT INTO tickets (
            author_id, book_id, subject, description, status, category,
            category_source, priority, priority_source, ai_status, ai_reason
          ) VALUES ($1, $2, $3, $4, 'open', 'book_status_production', 'ai', 'medium', 'ai', 'done', $5)
          RETURNING id`,
          [
            sId,
            sbId,
            'Cover design status update for Midnight in Mysore',
            'Hello team, could you please provide an update on when the cover design proof will be shared for my review?',
            'Author inquiring about current Cover Design production stage timeline.',
          ]
        );

        await client.query(
          `INSERT INTO ticket_messages (ticket_id, sender_id, body)
           VALUES ($1, $2, $3)`,
          [
            t2.rows[0].id,
            sId,
            'Hello team, could you please provide an update on when the cover design proof will be shared for my review?',
          ]
        );
      }
    }

    await client.query('COMMIT');

    const usersCount = await client.query(`SELECT COUNT(*) FROM users WHERE role = 'author'`);
    const adminsCount = await client.query(`SELECT COUNT(*) FROM users WHERE role = 'admin'`);
    const booksCount = await client.query(`SELECT COUNT(*) FROM books`);
    const ticketsCount = await client.query(`SELECT COUNT(*) FROM tickets`);

    console.log('--------------------------------------------------');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY');
    console.log(`Authors Seeded:  ${usersCount.rows[0].count} (Expected: 10)`);
    console.log(`Admins Seeded:   ${adminsCount.rows[0].count} (Expected: 2)`);
    console.log(`Books Seeded:    ${booksCount.rows[0].count} (Expected: 18)`);
    console.log(`Sample Tickets:  ${ticketsCount.rows[0].count}`);
    console.log('--------------------------------------------------');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
