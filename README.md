# BookLeaf Publishing - Author Support & Communication Portal

Technical Assignment: Full-Stack Developer Position (Assignment 1 of 2)

---

## 1. Project Overview & Context

BookLeaf Publishing is a leading self-publishing house operating across India and the United States, processing over 1,200 books monthly across an active catalog exceeding 22,000 titles. A critical operational challenge at this scale is handling author correspondence regarding quarterly royalty distributions, publication and printing timelines, ISBN assignments, and retail platform availability.

This repository contains the complete implementation of the Author Support & Communication Portal—a dual-interface web application engineered to automate ticket categorization, calculate priority scores, and generate knowledge-base grounded response drafts using large language models. The system reduces operational response times, eliminates communication inconsistencies, and provides authors with real-time transparency into their support inquiries.

---

## 2. System Architecture

The application is architected around a strict layered separation of concerns:

```
Client (React 19 + Vite + Tailwind CSS)
    | (REST API via Fetch / Real-Time via Socket.IO)
    v
Routes (URL mapping, rate limiting, authentication, and Zod validation)
    |
    v
Controllers (Request extraction, service delegation, DTO shaping)
    |
    v
Services (Core business logic, ACID transactions, socket emission)
    |
    +---> PostgreSQL 18 (Relational database with CASCADE integrity)
    |
    +---> AI Engine Layer (Groq primary, Gemini fallback, Sectioned KB, Guardrails)
```

- **Routes (`server/src/routes/`):** Purely declarative. Defines HTTP verbs, paths, middleware attachments, and validation schemas. Contains no business or database logic.
- **Controllers (`server/src/controllers/`):** Thin HTTP handlers wrapped with `asyncHandler`. Extracts request parameters, executes service calls, and shapes HTTP status codes and response bodies.
- **Services (`server/src/services/`):** Houses business rules, PostgreSQL transactions (`BEGIN ... COMMIT / ROLLBACK`), authorization boundary checks, and real-time socket broadcasts.
- **AI Integration Layer (`server/src/ai/`):** Abstracted multi-provider execution (Groq primary, Google Gemini fallback, deterministic offline fallback), prompt construction, and deterministic safety guardrails.
- **Client Architecture (`client/src/`):** React 19 single-page application built on Vite and Tailwind CSS. Employs React Context for session and socket state, client-side route guards (`ProtectedRoute`, `AdminRoute`), and clean component decomposition.

---

## 3. Detailed Requirements Implementation

### A. Author Portal (Author-Facing Interface)
- **Authentication:** Email and password login issuing signed JWT tokens. Sessions are persisted in `localStorage` and validated against `/api/auth/me`. Authors are strictly isolated to their own records; cross-author access attempts return `404 Not Found`.
- **My Books Dashboard (`/books`):** Renders all published titles owned by the authenticated author. Displays all ten required financial and catalog attributes: Title, ISBN, Genre, Publication Date, Production Status, MRP, Total Copies Sold, Total Royalty Earned, Royalty Paid, and Royalty Pending (formatted in Indian Rupees INR).
- **Submit Support Query (`/submit`):** Form enabling authors to raise support queries. Includes a dynamic book selector (with a default "General / Account Level" option), input-validated subject line, detailed description field, and file attachment interface pill.
- **My Tickets Dashboard (`/tickets`):** Chronological feed of submitted tickets with status filtering tabs (All Queries, Open, In Progress, Resolved, Closed) and message counter badges.
- **Real-Time Ticket Correspondence (`/tickets/:id`):** Displays public correspondence between the author and the BookLeaf operations team. Real-time updates delivered over authenticated WebSockets (`message:new`) ensure incoming admin responses appear immediately without requiring page refresh.

### B. Admin Portal (Internal Operations Dashboard)
- **Ticket Queue (`/admin/queue`):** Centralized operations triage queue displaying all incoming inquiries across all authors. Supports multi-parameter filtering by status, category, priority, and date range. Tickets exceeding 48 hours without resolution are visually flagged with an SLA breach indicator.
- **AI Auto-Classification:** Incoming queries are automatically classified asynchronously into one of six canonical categories:
  1. Royalty & Payments (`royalty_payments`)
  2. ISBN & Metadata Issues (`isbn_metadata`)
  3. Printing & Quality (`printing_quality`)
  4. Distribution & Availability (`distribution_availability`)
  5. Book Status & Production Updates (`book_status_production`)
  6. General Inquiry (`general_inquiry`)
- **AI Priority Scoring:** Assigns an automated priority level (Critical, High, Medium, Low) accompanied by a transparent reasoning string.
- **Admin Override Protection:** Operations staff can manually override category and priority. Setting a manual override marks the field source as `admin`, which permanently prevents subsequent background AI reclassifications from overwriting staff decisions.
- **Knowledge-Base Grounded Draft Workspace:** Presents staff with an AI-generated draft response adhering to BookLeaf tone guidelines and specific policy sections. Staff can review, modify, discard, or regenerate the draft before dispatching.
- **Internal Notes Panel:** Staff can record internal operational notes (`internal_notes` table) visible exclusively to administrators. Internal notes are physically stripped from author DTO payloads and are never broadcast over author socket rooms.
- **Ticket Management:** Staff can update resolution status, re-run classifications, and assign tickets to team members or claim self-assignment via a single click.

---

## 4. AI Engine & Knowledge Base Integration

### 4.1. Model Selection & Justification
- **Primary Provider:** Groq (`openai/gpt-oss-120b`). Chosen for ultra-low latency inference (<800ms Time-to-First-Token). Fast generation is essential in support workflows so operations agents are not blocked waiting for drafts to generate.
- **Fallback Provider:** Google Gemini (`gemini-1.5-flash`). Automatically invoked if Groq encounters rate limiting (HTTP 429), API exhaustion, or network timeouts.
- **Offline Heuristic Safeguard:** Deterministic keyword-based classifier that executes if all external LLM endpoints are unreachable, guaranteeing 100% application uptime.

### 4.2. Token Optimization via Sectioned Knowledge Base
To minimize token consumption and avoid polluting the context window:
- The BookLeaf Knowledge Base is split into modular policy documents (`companyOverview.js`, `royaltyPolicy.js`, `isbnPolicy.js`, `printingQuality.js`, `distributionAvailability.js`, `productionStages.js`, `toneGuidelines.js`).
- The draft generator injects only the policy section corresponding to the ticket's classified category, rather than transmitting the complete policy catalog on every invocation.
- Drafts are cached in the PostgreSQL `ai_drafts` table upon generation. Subsequent page visits retrieve the cached draft instantly without triggering redundant API calls.

### 4.3. Pre-Computed Business Facts
To eliminate arithmetic and timeline hallucinations common in LLM outputs:
- Node.js computes exact quarterly payout dates (Quarter End + 45 days) and validates the ₹1,000 minimum threshold before prompting the model.
- Pre-computed financial metrics from the database are passed directly into the prompt context as verified ground truth.

### 4.4. Deterministic Guardrails
All AI model outputs pass through a programmatic rules engine before database persistence:
- **ISBN Errors:** Any ticket referencing ISBN mismatches or catalog errors is forcibly assigned to category `isbn_metadata` and priority `high` or `critical`.
- **Legal Threats:** Keywords indicating litigation ("lawyer", "court", "legal notice", "sue") immediately escalate the ticket priority to `critical`.
- **Cosmetic Updates:** Requests for author bio or profile picture updates are demoted to priority `low`.

---

## 5. Technology Stack

- **Backend Runtime:** Node.js (ES Modules, v20+)
- **Server Framework:** Express 4 (with Helmet security headers, CORS, and Express Rate Limit)
- **Database:** PostgreSQL 18 (utilizing `pg` connection pool with parameterized SQL)
- **Real-Time Layer:** Socket.IO 4 (JWT-authenticated rooms and targeted emitters)
- **Validation:** Zod 4 (schema-driven environment and payload validation)
- **AI SDKs:** Groq SDK (`groq-sdk`) and Google Generative AI SDK (`@google/generative-ai`)
- **Frontend Framework:** React 19
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS 4
- **Routing:** React Router 7
- **Icons:** Lucide React

---

## 6. Project Directory Layout

```
Author-Support-Communication-Portal/
|-- client/                             # React 19 frontend application
|   |-- src/
|   |   |-- api/                        # HTTP client with auth interceptor
|   |   |-- components/
|   |   |   |-- admin/                  # AIDraftWorkspace, InternalNotesPanel, AdminQueueTable
|   |   |   |-- author/                 # TicketCard, TicketFilterTabs, MessageBubble
|   |   |   `-- common/                 # StatusBadge, PriorityBadge, PageHeader, Navbar
|   |   |-- context/                    # AuthContext and SocketContext providers
|   |   |-- pages/
|   |   |   |-- admin/                  # AdminQueue and AdminTicketDetail pages
|   |   |   `-- author/                 # Books, SubmitQuery, MyTickets, TicketDetail, Login
|   |   |-- routes/                     # ProtectedRoute and AdminRoute guards
|   |   `-- utils/                      # Currency (INR) and date formatting utilities
|   |-- index.html                      # HTML entry point with branding
|   |-- package.json
|   |-- vercel.json                     # SPA routing rewrite configuration
|   `-- vite.config.js                  # Vite configuration and API proxy
|-- server/                             # Node.js backend application
|   |-- src/
|   |   |-- ai/
|   |   |   |-- kb/                     # 7 modular Knowledge Base policy files
|   |   |   |-- prompts/                # Classification and response draft prompts
|   |   |   |-- providers/              # Groq and Gemini API adapters
|   |   |   |-- rules/                  # Guardrails and heuristic keyword fallback
|   |   |   |-- classifier.js           # Ticket classification service
|   |   |   `-- drafter.js              # Response drafting service
|   |   |-- config/                     # Zod-validated environment and database pool
|   |   |-- controllers/                # HTTP route controllers
|   |   |-- db/                         # PostgreSQL schema, migration runner, seed script
|   |   |-- middleware/                 # Auth, RBAC, Rate limiting, Zod validation, Error handler
|   |   |-- routes/                     # Express REST route definitions
|   |   |-- services/                   # Business logic and database operations
|   |   |-- sockets/                    # Socket.IO connection manager and room emitters
|   |   |-- utils/                      # AppError and asyncHandler helpers
|   |   |-- app.js                      # Express application setup and static SPA serving
|   |   `-- server.js                   # HTTP and WebSocket server initialization
|   |-- data/                           # Seed dataset (10 authors, 18 books)
|   |-- test/                           # Automated test suites
|   |-- .env.example                    # Documented environment variable template
|   `-- package.json
|-- docs/
|   |-- WRITEUP.md                      # Comprehensive architectural and scaling writeup
|   `-- calibration_results.md          # Output log for 7 acceptance calibration queries
|-- package.json                        # Root workspace scripts
`-- README.md                           # Master documentation
```

---

## 7. Seed Accounts & Demonstration Credentials

All author accounts are configured with the password `Author@123`. All admin accounts are configured with `Admin@123`.

| Role | Name | Email | Password | Catalog Context |
| :--- | :--- | :--- | :--- | :--- |
| **Author** | Priya Sharma | `priya.sharma@email.com` | `Author@123` | *Whispers of the Ganges*, *The Saffron Diaries* |
| **Author** | Rohit Kapoor | `rohit.kapoor@email.com` | `Author@123` | *Code & Karma*, *Startup Sutra* |
| **Author** | Sneha Patel | `sneha.patel@email.com` | `Author@123` | *The Silent Canvas* |
| **Author** | Anita Desai | `anita.desai@email.com` | `Author@123` | *Urban Solitude* (In Production - Cover Design) |
| **Author** | Vikram Malhotra | `vikram.malhotra@email.com` | `Author@123` | *Shadows of the Fort* |
| **Admin** | BookLeaf Admin | `admin@bookleaf.in` | `Admin@123` | Full system administrator |
| **Admin** | Operations Lead | `ops@bookleaf.in` | `Admin@123` | Support queue triage and ticket operations |

*Note: The login page includes quick-fill buttons for demo credentials.*

---

## 8. Local Setup & Installation

### 8.1. Prerequisites
- Node.js version 20 or higher
- PostgreSQL version 15 or higher
- A valid Groq API Key (or Google Gemini API Key)

### 8.2. Database Creation
Create the PostgreSQL database using `psql` or pgAdmin:
```sql
CREATE DATABASE bookleaf;
```

### 8.3. Environment Configuration
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bookleaf
JWT_SECRET=super_secret_development_key_at_least_32_characters
JWT_EXPIRES_IN=7d
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
DEMO_AUTHOR_PASSWORD=Author@123
DEMO_ADMIN_PASSWORD=Admin@123
```

Create `client/.env` based on `client/.env.example`:
```env
VITE_API_URL=/api
VITE_WS_URL=/
VITE_DEMO_AUTHOR_EMAIL=priya.sharma@email.com
VITE_DEMO_AUTHOR_PASSWORD=Author@123
VITE_DEMO_ADMIN_EMAIL=admin@bookleaf.in
VITE_DEMO_ADMIN_PASSWORD=Admin@123
```

### 8.4. Install Dependencies
Run the following commands from the root directory:
```bash
npm --prefix server install
npm --prefix client install
```

### 8.5. Run Schema Migration & Seed Data
Execute the migration and idempotent seed script:
```bash
npm run db:migrate
npm run db:seed
```

### 8.6. Launch Development Servers
Open two terminal windows:

Terminal 1 (Backend Server on port 5000):
```bash
npm run dev:server
```

Terminal 2 (Frontend Client on port 5173):
```bash
npm run dev:client
```

Access the application in your browser at `http://localhost:5173`.

---

## 9. API Specification

All endpoints communicate via JSON. Authenticated endpoints require an `Authorization: Bearer <token>` header.

### Authentication
- `POST /api/auth/login`: Accepts `email` and `password`. Returns JWT token and sanitized user profile object.
- `GET /api/auth/me`: Authenticated session validation. Returns current user details.

### Books
- `GET /api/books`:
  - Author request: Returns only books authored by the current user.
  - Admin request: Returns all catalog titles with optional `?authorId=<id>` filtering.
- `GET /api/books/:id`: Retrieves detailed book metadata with strict author ownership enforcement.

### Support Tickets
- `POST /api/tickets`: Author creates a support inquiry. Validates book ownership if `bookId` is provided. Saves ticket with `ai_status = 'pending'` and triggers background AI classification asynchronously.
- `GET /api/tickets`:
  - Author request: Returns only tickets submitted by the authenticated author. Supports status filtering (`?status=open|in_progress|resolved|closed`).
  - Admin request: Returns paginated queue with full filtering (`status`, `category`, `priority`, `assignedTo`, `q`, `from`, `to`, `page`, `limit`).
- `GET /api/tickets/:id`:
  - Author request: Returns public ticket details and conversation thread. Internal notes are excluded. Returns `404 Not Found` if accessed by another author.
  - Admin request: Returns complete record including AI reasoning, classification source flags, book financial context, messages, and internal notes.
- `PATCH /api/tickets/:id`: Admin updates ticket properties (`status`, `category`, `priority`, `assignedTo`). Flags `category_source = 'admin'` or `priority_source = 'admin'` to prevent subsequent automated overwrites.
- `POST /api/tickets/:id/messages`: Appends a public message to the correspondence thread. If submitted by an author on a resolved/closed ticket, the status transitions back to `in_progress`. Broadcasts in real-time over Socket.IO.
- `GET /api/tickets/:id/notes`: Admin-only. Retrieves internal operations notes.
- `POST /api/tickets/:id/notes`: Admin-only. Appends an internal operational note.
- `POST /api/tickets/:id/draft`: Admin-only. Returns the cached AI draft or generates a fresh draft based on the Knowledge Base. Pass `?regenerate=true` to force re-prompting the LLM.
- `POST /api/tickets/:id/reclassify`: Admin-only. Re-evaluates ticket classification while preserving any explicit human admin overrides.

---

## 10. Automated Verification Suites

The repository includes test suites that validate data integrity, AI engine reliability, and calibration against the sample queries provided in the assignment specification:

```bash
cd server

# 1. Database Schema and Health Verification
node test/db_health.js

# 2. Phase 4 AI Engine Integration Suite (21 test assertions)
node test/phase4_ai_test.js

# 3. Acceptance Calibration Runner (Evaluates the 7 official assignment queries)
node test/calibration_runner.js
```

Full outputs and analysis for the 7 official calibration scenarios are documented in [`docs/calibration_results.md`](docs/calibration_results.md).
Architectural scaling considerations and operational design are documented in [`docs/WRITEUP.md`](docs/WRITEUP.md).
