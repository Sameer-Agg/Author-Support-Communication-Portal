import http from 'http';
import { io } from '../../client/node_modules/socket.io-client/build/esm/index.js';

const BASE_URL = 'http://localhost:5000';
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

async function run() {
  console.log('Complete End-to-End System & API Verification');
  console.log('='.repeat(55));

  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@bookleaf.in',
    password: 'Admin@123',
  });
  log('Admin Login', adminLogin.status === 200 && !!adminLogin.body?.token);
  const adminToken = adminLogin.body?.token;

  const authorLogin = await request('POST', '/api/auth/login', {
    email: 'priya.sharma@email.com',
    password: 'Author@123',
  });
  log('Author Login', authorLogin.status === 200 && !!authorLogin.body?.token);
  const authorToken = authorLogin.body?.token;

  const meAuthor = await request('GET', '/api/auth/me', null, authorToken);
  log(
    'Author Profile (/api/auth/me)',
    meAuthor.status === 200 && meAuthor.body?.user?.role === 'author',
    `Name: ${meAuthor.body?.user?.name}`
  );

  const meAdmin = await request('GET', '/api/auth/me', null, adminToken);
  log(
    'Admin Profile (/api/auth/me)',
    meAdmin.status === 200 && meAdmin.body?.user?.role === 'admin',
    `Name: ${meAdmin.body?.user?.name}`
  );

  const booksRes = await request('GET', '/api/books', null, authorToken);
  log(
    'Author Books Query (/api/books)',
    booksRes.status === 200 && Array.isArray(booksRes.body?.books),
    `${booksRes.body?.books?.length || 0} books found`
  );

  const allBooksAdmin = await request('GET', '/api/books', null, adminToken);
  log(
    'Admin Catalog Query (/api/books)',
    allBooksAdmin.status === 200 && allBooksAdmin.body?.books?.length === 18,
    `${allBooksAdmin.body?.books?.length} total catalog books`
  );

  const ticketsQueue = await request('GET', '/api/tickets', null, adminToken);
  log(
    'Admin Ticket Queue (/api/tickets)',
    ticketsQueue.status === 200 && Array.isArray(ticketsQueue.body?.tickets),
    `${ticketsQueue.body?.tickets?.length} tickets in queue`
  );

  const authorTickets = await request('GET', '/api/tickets', null, authorToken);
  log(
    'Author Scoped Tickets (/api/tickets)',
    authorTickets.status === 200 && Array.isArray(authorTickets.body?.tickets)
  );

  const firstTicketId = ticketsQueue.body?.tickets?.[0]?.id || 1;
  const ticketDetail = await request('GET', `/api/tickets/${firstTicketId}`, null, adminToken);
  log(
    `Admin Ticket Detail (/api/tickets/${firstTicketId})`,
    ticketDetail.status === 200 && !!ticketDetail.body?.ticket?.id,
    `Subject: ${ticketDetail.body?.ticket?.subject}`
  );

  const socketConnected = await new Promise((resolve) => {
    const socket = io(BASE_URL, {
      auth: { token: authorToken },
      transports: ['websocket'],
      reconnectionAttempts: 1,
      timeout: 3000,
    });
    socket.on('connect', () => {
      socket.disconnect();
      resolve(true);
    });
    socket.on('connect_error', () => {
      socket.disconnect();
      resolve(false);
    });
  });
  log('Socket.IO Authenticated Handshake', socketConnected);

  console.log('\n' + '='.repeat(55));
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length} checks`);
}

run().catch(console.error);
