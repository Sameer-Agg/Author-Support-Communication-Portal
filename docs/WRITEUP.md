# BookLeaf Author Support Portal — Architecture & Design Write-Up

## 1. Architectural Priorities
The primary design goal was building a robust, auditable support system balancing author empathy with operational efficiency. Authors view their publishing journey as a deeply personal creative partnership; operational friction or delayed communication degrades trust. 

Key priorities:
- **Zero Author Blocking:** Ticket submission writes to PostgreSQL first and immediately returns HTTP 201. AI classification runs asynchronously via `queueTicketClassification(ticketId)` and broadcasts results over Socket.IO.
- **Strict Role Isolation & Security:** Internal operational notes reside in an isolated table (`internal_notes`). Author endpoints and Socket.IO payloads omit internal notes by database-level projection. Cross-author access returns a strict `404 Not Found` (never 403) to prevent author ID enumeration.
- **Deterministic AI Guardrails:** While LLMs excel at nuanced sentiment and language, legal threats, ISBN discrepancies, and threshold rollovers require deterministic rules. Guardrails enforce Critical priority on legal terms, High on ISBN mismatches, and Low on cosmetic metadata updates.
- **Token Smart Context Injection:** The system sections knowledge base policies (royalty, ISBN, printing, distribution, production stages). The drafter retrieves only the section corresponding to the ticket's category, injecting pre-computed mathematical facts (rollover threshold, next quarterly payout date) rather than requiring the LLM to deduce them.

---

## 2. Technical Decisions & Trade-Offs

| Decision | Selected Approach | Trade-Off & Alternative Considered |
| :--- | :--- | :--- |
| **Primary AI Provider** | Groq (`openai/gpt-oss-120b`) | Extremely low latency (<1s response) and reliable JSON schema output. Google Gemini (`gemini-1.5-flash`) acts as automatic fallback. |
| **Real-Time Communication** | Socket.IO with JWT Handshake Auth | Author private rooms (`user:<id>`) and admin broadcast rooms (`admins`). Avoided polling loops, providing instant notification of replies and status overrides. |
| **Draft Caching** | PostgreSQL `ai_drafts` Table | First admin view generates and persists the draft. Subsequent views serve the cached draft instantly. Admins can click "Regenerate" with `?regenerate=true` if new context arrives. |
| **State Management** | Context API (`AuthContext`, `SocketContext`) | Avoided heavy Redux boilerplate for a clean, maintainable architecture. Clean decoupled subscribers handle incoming socket events. |

---

## 3. Production Roadmap & Scaling Considerations

For enterprise scale (millions of books and hundreds of thousands of tickets):
1. **Background Job Queue:** Replace Node.js `setImmediate` with **BullMQ** or **Temporal** backed by Redis. This guarantees at-least-once classification execution, persistent retry backoff with jitter, and dead-letter queues.
2. **Socket.IO Redis Adapter:** Implement `@socket.io/redis-adapter` to distribute WebSockets across multi-node Kubernetes pods behind an ALB.
3. **Cloud Object Storage for Attachments:** Migrate UI attachment simulation to pre-signed AWS S3 / Cloudflare R2 upload URLs with antivirus scanning via ClamAV Lambda.
4. **LLM Observability & Evals:** Integrate OpenTelemetry / Langfuse to track token consumption, latency percentiles, and prompt drift over time.
5. **Vector Search (RAG):** If the knowledge base expands to thousands of publisher agreements and distributor contracts, incorporate pgvector embeddings for semantic retrieval.

