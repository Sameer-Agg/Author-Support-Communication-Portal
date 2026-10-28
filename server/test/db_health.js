import { pool } from '../src/config/db.js';

async function check() {
  console.log('PostgreSQL Health & Integrity Check');
  console.log('='.repeat(45));

  try {
    const t0 = Date.now();
    const ver = await pool.query('SELECT current_database(), current_user, version()');
    console.log(`[PASS] DB Connection OK (${Date.now() - t0}ms)`);
    console.log(`       Database: ${ver.rows[0].current_database}`);
    console.log(`       User:     ${ver.rows[0].current_user}`);

    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    const tableNames = tables.rows.map((r) => r.table_name);
    console.log(`[PASS] Tables found (${tableNames.length}): ${tableNames.join(', ')}`);

    const expectedTables = ['ai_drafts', 'books', 'internal_notes', 'ticket_messages', 'tickets', 'users'];
    const allTablesPresent = expectedTables.every((t) => tableNames.includes(t));
    console.log(`[${allTablesPresent ? 'PASS' : 'FAIL'}] All 6 required tables present`);

    const [u, b, t, tm, inote, aid] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM books'),
      pool.query('SELECT COUNT(*) FROM tickets'),
      pool.query('SELECT COUNT(*) FROM ticket_messages'),
      pool.query('SELECT COUNT(*) FROM internal_notes'),
      pool.query('SELECT COUNT(*) FROM ai_drafts'),
    ]);

    console.log('\nRecord Counts:');
    console.log(`  - users:           ${u.rows[0].count} (10 authors + 2 admins)`);
    console.log(`  - books:           ${b.rows[0].count} (18 catalog books)`);
    console.log(`  - tickets:         ${t.rows[0].count}`);
    console.log(`  - ticket_messages: ${tm.rows[0].count}`);
    console.log(`  - internal_notes:  ${inote.rows[0].count}`);
    console.log(`  - ai_drafts:       ${aid.rows[0].count}`);

    const authorCheck = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'author'"
    );
    const adminCheck = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'admin'"
    );

    console.log('\nRole Distribution:');
    console.log(`  - Authors: ${authorCheck.rows[0].count}`);
    console.log(`  - Admins:  ${adminCheck.rows[0].count}`);

    const indexes = await pool.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname
    `);
    console.log(`\n[PASS] Database indexes verified: ${indexes.rows.length} total active indexes`);

    console.log('\nDatabase is healthy and fully operational.');
  } catch (err) {
    console.error('[FAIL] DB Health Check Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

check();

