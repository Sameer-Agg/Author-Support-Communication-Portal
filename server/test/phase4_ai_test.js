import http from 'http';
import { pool } from '../src/config/db.js';

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
let authorToken = '';
let authorId = 0;
let testTicketId = 0;
const results = [];

function log(label, pass, detail = '') {
  const tag = pass ? 'PASS' : 'FAIL';
  results.push({ label, pass });
  console.log(`[${tag}] ${label}${detail ? ' — ' + detail : ''}`);
}

function request(method, path, body = null, token = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('Phase 4 AI Engine Integration Tests');
  console.log('='.repeat(50));

  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@bookleaf.in',
    password: 'Admin@123',
  });
  adminToken = adminLogin.body?.token || '';
  log('Admin login', adminLogin.status === 200 && !!adminToken);

  const authorRes = await pool.query(
    "SELECT id, email FROM users WHERE role = 'author' LIMIT 1"
  );
  authorId = authorRes.rows[0].id;
  const authorLogin = await request('POST', '/api/auth/login', {
    email: authorRes.rows[0].email,
    password: 'Author@123',
  });
  authorToken = authorLogin.body?.token || '';
  log('Author login', authorLogin.status === 200 && !!authorToken);

  const authorBooks = await request('GET', '/api/books', null, authorToken);
  const firstBook = authorBooks.body?.books?.[0];
  log('Author has books', !!firstBook, firstBook?.title || 'none');

  console.log('\n--- Test 1: Ticket creation triggers background AI classification ---');
  const createRes = await request(
    'POST',
    '/api/tickets',
    {
      bookId: firstBook?.id || null,
      subject: 'ISBN on Amazon shows wrong number for my book',
      description:
        'The ISBN displayed on the Amazon listing for my book does not match the one in my publishing agreement. The agreement says 978-93-XXXXX-XX-X but Amazon shows a completely different number. This is a serious error that needs immediate correction.',
    },
    authorToken
  );
  testTicketId = createRes.body?.ticket?.id || 0;
  log(
    'Ticket created with ai_status=pending',
    createRes.status === 201 && createRes.body?.ticket?.ai_status === 'pending',
    `ticket #${testTicketId}`
  );

  await sleep(8000);

  const ticketAfterAI = await request(
    'GET',
    `/api/tickets/${testTicketId}`,
    null,
    adminToken
  );
  const t = ticketAfterAI.body?.ticket;
  log(
    'AI classification completed (ai_status != pending)',
    t?.aiStatus === 'done' || t?.aiStatus === 'failed',
    `aiStatus=${t?.aiStatus}`
  );

  console.log('\n--- Test 2: Classification produces valid canonical category/priority ---');
  const validCats = [
    'royalty_payments',
    'isbn_metadata',
    'printing_quality',
    'distribution_availability',
    'book_status_production',
    'general_inquiry',
  ];
  const validPris = ['critical', 'high', 'medium', 'low'];
  log(
    'Category is canonical',
    validCats.includes(t?.category),
    t?.category
  );
  log(
    'Priority is canonical',
    validPris.includes(t?.priority),
    t?.priority
  );
  log(
    'AI reason is populated',
    typeof t?.aiReason === 'string' && t?.aiReason.length > 0,
    t?.aiReason?.slice(0, 80)
  );

  console.log('\n--- Test 3: ISBN guardrail enforcement ---');
  log(
    'ISBN ticket classified as isbn_metadata',
    t?.category === 'isbn_metadata',
    t?.category
  );
  log(
    'ISBN ticket priority >= high',
    t?.priority === 'high' || t?.priority === 'critical',
    t?.priority
  );

  console.log('\n--- Test 4: Legal keyword guardrail -> critical ---');
  const legalRes = await request(
    'POST',
    '/api/tickets',
    {
      subject: 'Legal action regarding unpaid royalties',
      description:
        'I have consulted my lawyer and we are considering taking this matter to consumer forum if my pending royalties are not released within the next 10 days.',
    },
    authorToken
  );
  const legalTicketId = legalRes.body?.ticket?.id;
  log('Legal ticket created', legalRes.status === 201, `ticket #${legalTicketId}`);

  await sleep(8000);

  const legalTicket = await request(
    'GET',
    `/api/tickets/${legalTicketId}`,
    null,
    adminToken
  );
  const lt = legalTicket.body?.ticket;
  log(
    'Legal ticket priority = critical (guardrail)',
    lt?.priority === 'critical',
    `priority=${lt?.priority}`
  );

  console.log('\n--- Test 5: Admin override protection ---');
  const overrideRes = await request(
    'PATCH',
    `/api/tickets/${testTicketId}`,
    { category: 'printing_quality', priority: 'low' },
    adminToken
  );
  log(
    'Admin override accepted',
    overrideRes.status === 200,
    `categorySource=${overrideRes.body?.ticket?.category_source}`
  );

  const reclassifyRes = await request(
    'POST',
    `/api/tickets/${testTicketId}/reclassify`,
    {},
    adminToken
  );
  const reclassified = reclassifyRes.body?.ticket;
  log(
    'Reclassify does not overwrite admin category',
    reclassified?.category_source === 'admin' && reclassified?.category === 'printing_quality',
    `category=${reclassified?.category}, source=${reclassified?.category_source}`
  );
  log(
    'Reclassify does not overwrite admin priority',
    reclassified?.priority_source === 'admin' && reclassified?.priority === 'low',
    `priority=${reclassified?.priority}, source=${reclassified?.priority_source}`
  );

  console.log('\n--- Test 6: Draft generation ---');
  const draftRes = await request(
    'POST',
    `/api/tickets/${testTicketId}/draft`,
    {},
    adminToken
  );
  log(
    'Draft generated successfully',
    draftRes.status === 200 && draftRes.body?.draft?.draftText?.length > 50,
    `${draftRes.body?.draft?.draftText?.length || 0} chars, model=${draftRes.body?.draft?.model}`
  );

  console.log('\n--- Test 7: Draft caching (second call returns cached) ---');
  const cachedDraftRes = await request(
    'POST',
    `/api/tickets/${testTicketId}/draft`,
    {},
    adminToken
  );
  log(
    'Cached draft returned (same id)',
    cachedDraftRes.status === 200 &&
      cachedDraftRes.body?.draft?.id === draftRes.body?.draft?.id,
    `original id=${draftRes.body?.draft?.id}, cached id=${cachedDraftRes.body?.draft?.id}`
  );

  console.log('\n--- Test 8: Regenerate creates new draft ---');
  const regenRes = await request(
    'POST',
    `/api/tickets/${testTicketId}/draft?regenerate=true`,
    {},
    adminToken
  );
  log(
    'Regenerated draft has different id',
    regenRes.status === 200 &&
      regenRes.body?.draft?.id !== draftRes.body?.draft?.id,
    `new id=${regenRes.body?.draft?.id}`
  );

  console.log('\n--- Test 9: Author cannot access draft/reclassify ---');
  const authorDraftRes = await request(
    'POST',
    `/api/tickets/${testTicketId}/draft`,
    {},
    authorToken
  );
  log(
    'Author blocked from draft endpoint',
    authorDraftRes.status === 403
  );

  const authorReclassifyRes = await request(
    'POST',
    `/api/tickets/${testTicketId}/reclassify`,
    {},
    authorToken
  );
  log(
    'Author blocked from reclassify endpoint',
    authorReclassifyRes.status === 403
  );

  console.log('\n--- Test 10: Bio/general ticket gets low priority ---');
  const bioRes = await request(
    'POST',
    '/api/tickets',
    {
      subject: 'How can I update my author bio?',
      description:
        'I recently changed my professional profile and would like to update bio description displayed on the BookLeaf website. Can you guide me through the process?',
    },
    authorToken
  );
  const bioTicketId = bioRes.body?.ticket?.id;
  await sleep(8000);

  const bioTicket = await request(
    'GET',
    `/api/tickets/${bioTicketId}`,
    null,
    adminToken
  );
  const bt = bioTicket.body?.ticket;
  log(
    'Bio update ticket priority = low',
    bt?.priority === 'low',
    `priority=${bt?.priority}, category=${bt?.category}`
  );

  console.log('\n' + '='.repeat(50));
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length} tests`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter((r) => !r.pass).forEach((r) => console.log(`  - ${r.label}`));
  }

  await pool.end();
}

run().catch((e) => {
  console.error('Test runner error:', e);
  pool.end();
  process.exit(1);
});
