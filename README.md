# BookLeaf Author Support & Communication Portal

An AI-powered Author Support and Communication Portal built for BookLeaf Publishing. The platform features dual interfaces: an **Author Portal** for authors to manage books, track quarterly royalties, and submit support tickets, and an **Admin Portal** for the operations team featuring AI-assisted ticket auto-classification, priority scoring, and knowledge-base grounded response drafting.

---

## 1. Architecture Overview

The application follows a strict layered architecture:
```
Routes -> Controllers -> Services -> Database & AI Providers
```

- **Routes:** URL routing, middleware attachment, and HTTP verb definitions. No business logic.
- **Controllers:** Request extraction, service invocation, and DTO response shaping. No direct SQL queries.
- **Services:** Core business logic, transactional database queries, and real-time socket emissions.
- **AI Integration Layer:** Provider-agnostic interfaces (Groq primary, Gemini fallback), sectioned Knowledge Base context, strict Zod schema validation, and deterministic guardrails.

```
bookleaf/
├── client/                      # React 19 + Vite + Tailwind CSS v4 frontend
│   └── src/
│       ├── api/                 # Fetch API client with auth header & 401 interceptor
│       ├── context/             # AuthContext, SocketContext
│       ├── components/          # Reusable UI (badges, Navbar, Admin components)
│       │   ├── common/          # StatusBadge, PriorityBadge, Navbar
│       │   └── admin/           # AIDraftWorkspace, InternalNotesPanel, BookFactsSidebar, SourceIndicator
│       ├── pages/
│       │   ├── author/          # Books, SubmitQuery, MyTickets, TicketDetail, Login
│       │   └── admin/           # AdminQueue, AdminTicketDetail
│       ├── routes/              # ProtectedRoute, AdminRoute
│       └── utils/               # Currency (Indian INR) and relative date formatters
├── server/                      # Node.js + Express backend (ES Modules)
│   ├── src/
│   │   ├── config/              # Zod-validated environment config and PostgreSQL pool
│   │   ├── db/                  # SQL schema, migration runner, and idempotent seed script
│   │   ├── middleware/          # JWT auth, RBAC, Zod validation, error handler, rate limits
│   │   ├── routes/              # RESTful API route definitions (auth, books, tickets)
│   │   ├── controllers/         # Thin HTTP controllers
│   │   ├── services/            # Business logic and parameterised SQL queries
│   │   ├── sockets/             # Socket.IO authenticated rooms and event emitters
│   │   ├── ai/                  # LLM providers, sectioned KB, prompt builders, guardrails
│   │   ├── utils/               # AppError and asyncHandler helpers
│   │   ├── app.js               # Express application setup
│   │   └── server.js            # HTTP + Socket.IO server with graceful shutdown
│   ├── data/                    # Seed dataset (10 authors, 18 books)
│   ├── test/                    # Automated integration & health test suites
│   ├── .env.example             # Documented environment template
│   └── .env                     # Local secrets (strictly git-ignored)
├── docs/                        # Architecture writeup, calibration results, diagrams
│   ├── WRITEUP.md               # 1-page design & scaling writeup
│   └── calibration_results.md   # Official 7 calibration queries and AI outputs
├── ROADMAP.md                   # 7-phase execution roadmap
└── README.md                    # System documentation
```

---

## 2. Seed Accounts & Credentials

All author accounts have password `Author@123`. All admin accounts have password `Admin@123`.

| Role | Name | Email | Password | Catalog Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Author** | Priya Sharma | `priya.sharma@email.com` | `Author@123` | *Whispers of the Ganges*, *The Saffron Diaries* |
| **Author** | Rohit Kapoor | `rohit.kapoor@email.com` | `Author@123` | *Code & Karma*, *Startup Sutra* |
| **Author** | Sneha Patel | `sneha.patel@email.com` | `Author@123` | *The Silent Canvas* |
| **Author** | Anita Desai | `anita.desai@email.com` | `Author@123` | *Urban Solitude* (In Production - Cover Design) |
| **Author** | Vikram Malhotra | `vikram.malhotra@email.com` | `Author@123` | *Shadows of the Fort* |
| **Admin** | BookLeaf Admin | `admin@bookleaf.in` | `Admin@123` | Full administrative operations |
| **Admin** | Operations Lead | `ops@bookleaf.in` | `Admin@123` | Ticket queue and triage |

---

## 3. Getting Started & Setup

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL (v15+)
- Groq API Key (in `server/.env`)

### Database Setup
1. Create PostgreSQL database:
```sql
CREATE DATABASE bookleaf;
```
2. Configure `server/.env` based on `server/.env.example`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:1234@localhost:5432/bookleaf
JWT_SECRET=super_secret_jwt_key_bookleaf_assignment_2026
JWT_EXPIRES_IN=7d
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=
CLIENT_URL=http://localhost:5173
```

3. Run schema migration and seed script:
```powershell
cd server
node src/db/migrate.js
node src/db/seed.js
```

### Running Backend Server
```powershell
cd server
npm.cmd run dev
```
Server runs on `http://localhost:5000`.

### Running Frontend Client
```powershell
cd client
npm.cmd run dev
```
Client runs on `http://localhost:5173`. Proxies `/api` and `/socket.io` to port 5000.

---

## 4. API Endpoints Reference

All endpoints accept and return JSON. Authenticated endpoints require `Authorization: Bearer <jwt>`.

### Authentication
- `POST /api/auth/login`: Authenticate with email/password, returns JWT token + user profile.
- `GET /api/auth/me`: Validate JWT token and retrieve current user session.

### Books
- `GET /api/books`: 
  - Authors receive only their owned books.
  - Admins receive all 18 catalog books (with optional `?authorId=<id>` filter).
- `GET /api/books/:id`: Retrieve single book by ID with ownership check.

### Tickets & Support
- `POST /api/tickets`: Author creates a support query. Validates book ownership if `bookId` is supplied. Immediately saves to database with `ai_status = 'pending'` and triggers background AI classification without blocking.
- `GET /api/tickets`: 
  - Authors receive only their own tickets.
  - Admins receive the full ticket queue with pagination (`page`, `limit`) and filters (`status`, `category`, `priority`, `assignedTo`, `q`).
- `GET /api/tickets/:id`: 
  - Authors receive author-shaped DTO (returns `404 Not Found` if accessed by a different author). Internal notes are strictly excluded.
  - Admins receive full ticket details including AI classification metadata, book context, messages, and internal notes.
- `POST /api/tickets/:id/messages`: Post a reply in the public correspondence thread. Re-opens resolved/closed tickets if sent by the author. Broadcasts over Socket.IO.
- `PATCH /api/tickets/:id`: Admin overrides ticket status, category, priority, or assignee. Sets `category_source = 'admin'` / `priority_source = 'admin'`.
- `GET /api/tickets/:id/notes`: Admin-only. Retrieve internal operations notes.
- `POST /api/tickets/:id/notes`: Admin-only. Record a new internal operations note.
- `POST /api/tickets/:id/draft`: Admin-only. Generates or returns cached AI draft response. Pass `?regenerate=true` to force fresh LLM generation.
- `POST /api/tickets/:id/reclassify`: Admin-only. Re-runs AI classification while respecting existing admin overrides.

---

## 5. AI Engine & Intelligence Strategy

- **Primary Provider:** Groq (`openai/gpt-oss-120b`), providing sub-second generation (<1000ms) with strict JSON output.
- **Fallback Provider:** Google Gemini (`gemini-1.5-flash`), automatically engaged if Groq fails or times out.
- **Sectioned Knowledge Base:** 7 modular policy files (`companyOverview.js`, `royaltyPolicy.js`, `isbnPolicy.js`, `printingQuality.js`, `distributionAvailability.js`, `productionStages.js`, `toneGuidelines.js`). The drafter injects only the section relevant to the ticket's category to maximize token efficiency.
- **Deterministic Guardrails:**
  - ISBN issues $\rightarrow$ `isbn_metadata` and priority $\ge$ `high`.
  - Legal threats $\rightarrow$ priority = `critical`.
  - Cosmetic bio/photo updates $\rightarrow$ priority = `low`.
  - Handled in both AI-success and fallback paths.
- **Computed Facts Injection:** Payout dates ($Q + 45\text{ days}$), sub-₹1,000 threshold rollovers, and exact book sales numbers are pre-computed deterministically in Node.js before prompting the drafter to prevent mathematical hallucinations.
- **Draft Caching:** Generated drafts are stored in the `ai_drafts` table. Subsequent admin views retrieve the cached draft instantly.
- **Admin Override Protection:** Fields marked with `source = 'admin'` are immutable to subsequent AI reclassifications.

---

## 6. Real-Time Socket.IO Pipeline

- **Authentication:** Socket handshake authenticates JWT token. Unauthenticated connections are rejected.
- **Room Isolation:**
  - Author joins private room `user:<userId>`.
  - Admins join shared room `admins`.
- **Event Pipeline:**
  - `ticket:created`: Emitted to `admins` room when an author submits a query.
  - `message:new`: Emitted to `user:<authorId>` and `admins` on every new thread reply.
  - `ticket:updated`: Emitted to both author and `admins` on status/priority changes.
  - `ai:classified`: Emitted to `admins` when background classification completes.
- **Payload Hygiene:** Internal operational notes are never broadcast to the author room.

---

## 7. Verification & Automated Test Suites

The project includes automated integration suites:

```powershell
cd server

# 1. Database Health & Schema Check:
node test/db_health.js

# 2. Phase 4 AI Engine Integration Test:
node test/phase4_ai_test.js

# 3. Full System & API Verification Test:
node test/full_system_test.js

# 4. Acceptance Calibration Runner (7 rules.md queries):
node test/calibration_runner.js
```

Results of the 7 calibration queries are documented in [`docs/calibration_results.md`](docs/calibration_results.md).
The design and architectural write-up is documented in [`docs/WRITEUP.md`](docs/WRITEUP.md).
