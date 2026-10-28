# BookLeaf Author Support & Communication Portal

An AI-powered Author Support and Communication Portal built for BookLeaf Publishing. The platform features dual interfaces: an **Author Portal** for authors to manage books, track quarterly royalties, and submit support tickets, and an **Admin Portal** for the operations team featuring AI-assisted ticket auto-classification, priority scoring, and knowledge-base grounded response drafting.

---

## 🏗️ Architecture Overview

The application follows a strict layered architecture:
```
Routes → Controllers → Services → Database & AI Providers
```

- **Routes:** URL routing, middleware attachment, and HTTP verb definitions. No business logic.
- **Controllers:** Request extraction, service invocation, and DTO response shaping. No direct SQL queries.
- **Services:** Core business logic, transactional database queries, and real-time socket emissions.
- **AI Integration Layer:** Provider-agnostic interfaces (Groq primary, Gemini fallback), sectioned Knowledge Base context, strict Zod schema validation, and deterministic guardrails.

```
bookleaf/
├── client/                      # React 19 + Vite frontend
│   └── src/
│       ├── api/                 # Axios/Fetch API client with auth interceptor
│       ├── context/             # AuthContext, SocketContext
│       ├── components/          # Reusable UI (badges, tables, toasts, empty/loading states)
│       ├── pages/
│       │   ├── author/          # Books, SubmitQuery, MyTickets, TicketDetail
│       │   └── admin/           # Queue, TicketDetail (AI draft + internal notes)
│       ├── routes/              # ProtectedRoute, AdminRoute
│       └── utils/               # Currency (₹) and relative date formatters
├── server/                      # Node.js + Express backend (ES Modules)
│   ├── src/
│   │   ├── config/              # Zod-validated environment config and PostgreSQL pool
│   │   ├── db/                  # SQL schema, migration runner, and idempotent seed script
│   │   ├── middleware/          # JWT auth, RBAC, Zod validation, error handler, rate limits
│   │   ├── routes/              # RESTful API route definitions
│   │   ├── controllers/         # Thin HTTP controllers
│   │   ├── services/            # Business logic and parameterised SQL queries
│   │   ├── sockets/             # Socket.IO authenticated rooms and event emitters
│   │   ├── ai/                  # LLM providers, sectioned KB, prompt builders, guardrails
│   │   ├── utils/               # AppError and asyncHandler helpers
│   │   ├── app.js               # Express application setup
│   │   └── server.js            # HTTP + Socket.IO server with graceful shutdown
│   ├── data/                    # Seed dataset (10 authors, 18 books)
│   ├── .env.example             # Documented environment template
│   └── .env                     # Local secrets (strictly git-ignored)
├── docs/                        # AI sample outputs, diagrams, API specs
├── README.md                    # Project documentation
└── .gitignore                   # Ignored files, dependencies, and environment secrets
```

---

## 🛠️ Tech Stack & Technical Decisions

| Layer | Technology | Decision Rationale |
|---|---|---|
| **Frontend** | React 19 (Vite) | Lightning-fast HMR, modular component structure, and minimal footprint. |
| **Styling** | Tailwind CSS v4 | Utility-first, responsive, accessible design with zero runtime overhead. |
| **Backend** | Node.js + Express | Native ES modules, robust middleware ecosystem, and clean RESTful design. |
| **Database** | PostgreSQL 18 | Strong relational guarantees, relational constraints, and JSON support. |
| **Real-time** | Socket.IO | Handshake-level JWT authentication, room isolation (`user:<id>`, `admins`), and instant push updates. |
| **Validation** | Zod | Runtime validation for env variables, incoming request bodies/queries, and LLM JSON outputs. |
| **Authentication**| JWT + bcryptjs | Stateless role-based access control (`author` vs `admin`) with cryptographically secure passwords. |
| **AI Layer** | Groq (Llama-3.3-70b / 3.1-8b) | Sub-second inference latency, deterministic JSON mode, and high accuracy for support classification and drafting. |
| **Fallback AI** | Google Gemini | High reliability fallback provider for graceful degradation during rate limits or outages. |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or newer (tested with v24.x)
- **npm**: v9.0.0 or newer
- **PostgreSQL**: v14 or newer (running locally or remote)

### 1. Installation

Install dependencies for both backend and frontend:

```powershell
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

cd ..
```

### 2. Environment Configuration

Copy the example environment file into `server/.env`:

```powershell
cp server/.env.example server/.env
```

Configure your PostgreSQL credentials and LLM API keys:

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bookleaf
JWT_SECRET=your_secure_random_jwt_secret_at_least_32_characters
JWT_EXPIRES_IN=7d

# Groq API Key (Primary LLM)
GROQ_API_KEY=gsk_your_groq_key_here

# Google Gemini API Key (Fallback LLM - optional)
GEMINI_API_KEY=your_gemini_key_here

DEMO_AUTHOR_PASSWORD=Author@123
DEMO_ADMIN_PASSWORD=Admin@123
```

> **Security Note:** `.env` is strictly git-ignored and never committed or sent to the frontend.

### 3. Database Migration & Seeding

Create the database and seed it with the official BookLeaf dataset (10 authors, 18 books):

```powershell
npm run db:migrate
npm run db:seed
```

### 4. Running the Development Servers

Start both servers:

```powershell
# In terminal 1 (Backend API & Socket.IO)
npm run dev:server

# In terminal 2 (Vite React Client)
npm run dev:client
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Demo Test Credentials

| Role | Email | Password |
|---|---|---|
| **Author (AUTH001)** | `priya.sharma@email.com` | `Author@123` |
| **Author (AUTH007 - In Production)** | `sneha.kulkarni@email.com` | `Author@123` |
| **Author (AUTH009 - Below ₹1k threshold)** | `kavita.deshmukh@email.com` | `Author@123` |
| **Operations Admin** | `admin@bookleaf.in` | `Admin@123` |

---

## 🤖 AI Integration & Cost Strategy

1. **Sectioned Knowledge Base Injection:** Rather than passing the complete knowledge base on every query (~5,000 tokens), the system passes only the company overview and the specific policy section relevant to the ticket's category (~500 tokens), reducing token consumption by ~85%.
2. **Computed Fact Grounding:** Key dynamic figures (such as the next quarterly payout date calculated as Quarter End + 45 days, rollover status for amounts under ₹1,000, and current production stages) are computed deterministically in JavaScript before being supplied to the LLM prompt. The model is instructed to present facts rather than calculate them.
3. **Deterministic Guardrails:** Critical conditions (such as ISBN mismatches or urgent overdue payments) automatically enforce high priority classifications regardless of LLM variance.
4. **Draft Caching:** AI drafts are generated on-demand when an admin views the ticket and cached in the database (`ai_drafts`), avoiding redundant API calls.
5. **Graceful Degradation:** If AI providers are unavailable or rate-limited, tickets are created uninterrupted with safe defaults, and admins retain full manual drafting and editing capabilities with an AI status alert.

---

## 🔒 Security & Data Isolation

- **Role-Based Access Control (RBAC):** Authors access only their own data verified via `req.user.id`. Cross-author ticket requests return `404 Not Found` to prevent ID enumeration.
- **Internal Notes Isolation:** Internal admin notes are stored in a dedicated table (`internal_notes`) and strictly excluded from author-facing endpoints and author WebSocket rooms.
- **Input Sanitization & Parameterised SQL:** All SQL queries use parameterised statements (`$1, $2`) preventing SQL injection. Input schemas are strictly validated via Zod.
