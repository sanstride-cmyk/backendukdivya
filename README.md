# Connect Marketing Solutions — Backend

A production-ready Node.js/TypeScript backend for the Connect Marketing Solutions website.

---

## Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Runtime      | Node.js 20                        |
| Framework    | Express 4                         |
| Language     | TypeScript 5                      |
| Database     | PostgreSQL 16 + Drizzle ORM       |
| Validation   | Zod                               |
| Email        | Nodemailer (SMTP)                 |
| Logging      | Pino                              |
| Security     | Helmet, express-rate-limit, CORS  |
| Container    | Docker + Docker Compose           |

---

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Entry point + graceful shutdown
│   ├── app.ts                # Express app + middleware
│   ├── schema/
│   │   └── index.ts          # Drizzle schema (contacts, leads, chat_sessions)
│   ├── routes/
│   │   ├── index.ts          # Router aggregator
│   │   ├── health.ts         # GET /api/healthz
│   │   ├── contact.ts        # POST/GET /api/contact
│   │   ├── leads.ts          # POST/GET/PATCH /api/leads
│   │   └── chat.ts           # POST /api/chat/session & /complete
│   ├── services/
│   │   └── email.ts          # Nodemailer — notifications + auto-reply
│   ├── middleware/
│   │   ├── errors.ts         # Global error handler
│   │   └── rateLimiter.ts    # Global + per-route rate limits
│   └── lib/
│       ├── db.ts             # Drizzle + pg Pool
│       └── logger.ts         # Pino logger
├── drizzle/
│   └── 0000_init.sql         # Raw SQL migration (run once)
├── frontend-integration/
│   ├── api.ts                # Drop into frontend src/lib/api.ts
│   ├── LeadPopup.updated.tsx # Popup with real API calls
│   ├── ChatBot.updated.tsx   # Chatbot with session persistence
│   └── HomePage.patch.tsx    # Contact form patch instructions
├── .env.example
├── drizzle.config.ts
├── Dockerfile
└── docker-compose.yml
```

---

## Quick Start

### 1. Environment variables

```bash
cp .env.example .env
# Edit .env — fill in DATABASE_URL, SMTP_*, EMAIL_NOTIFY, ALLOWED_ORIGINS
```

### 2. Run with Docker Compose (recommended)

```bash
# Add SMTP credentials to .env, then:
docker compose up --build
```

Database is auto-initialized from `drizzle/0000_init.sql`.

### 3. Run locally (without Docker)

```bash
# Requires: Node 20+, pnpm, a running PostgreSQL instance
pnpm install
# Set DATABASE_URL in .env to your local Postgres
psql $DATABASE_URL -f drizzle/0000_init.sql   # create tables once
pnpm dev                                        # hot-reload dev server
```

---

## API Reference

### Health
```
GET /api/healthz
→ { status: "ok"|"degraded", services: { database: "ok"|"error" } }
```

### Contact Form
```
POST /api/contact
Body: { name, email, phone?, message }
→ 201 { success: true, message, data: { id } }
→ 422 { success: false, errors: [...] }

GET /api/contact
→ { success: true, data: [...], count }
```

### Lead Capture
```
POST /api/leads
Body: { name, email, phone?, interestedService?, source }
  source: "contact_form"|"popup"|"chatbot"|"whatsapp"|"other"
→ 201 { success: true, message, data: { id } }

GET /api/leads
→ { success: true, data: [...], count }

PATCH /api/leads/:id/status
Body: { status: "new"|"contacted"|"qualified"|"converted"|"lost" }
→ { success: true, data: updatedLead }
```

### Chat Sessions
```
POST /api/chat/session
Body: { sessionId?, name?, email?, phone?, interestedService? }
→ 201 { success: true, data: { sessionId, ... } }

POST /api/chat/complete
Body: { sessionId }
→ { success: true, message, data?: { leadId } }
```

---

## Frontend Integration

1. **Copy** `frontend-integration/api.ts` → `src/lib/api.ts` in your Vite project
2. **Add** `VITE_API_URL=http://localhost:3000/api` to your frontend `.env`
3. **Replace** frontend components with the updated versions in `frontend-integration/`:
   - `LeadPopup.updated.tsx` → `src/components/LeadPopup.tsx`
   - `ChatBot.updated.tsx` → `src/components/ChatBot.tsx`
   - Apply `HomePage.patch.tsx` changes to `src/pages/HomePage.tsx`
4. **Install** `uuid` in the frontend: `pnpm add uuid @types/uuid`

---

## Email Setup (Gmail)

1. Enable 2FA on your Google account
2. Generate an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Set in `.env`:
   ```
   SMTP_USER=you@gmail.com
   SMTP_PASS=your-16-char-app-password
   EMAIL_NOTIFY=admin@yourcompany.com
   ```

Every contact/lead submission sends:
- **Notification email** to `EMAIL_NOTIFY` with full details
- **Auto-reply** to the submitter confirming receipt

---

## Security Features

- **Helmet** — sets secure HTTP headers
- **CORS** — allowlist-based origin control
- **Rate limiting** — 100 req/15min globally; 5 submissions/15min for forms
- **Input validation** — Zod schemas on every endpoint
- **Payload size limit** — 10kb max body
- **Trust proxy** — correct IP detection behind nginx/Cloudflare
- **Graceful shutdown** — SIGTERM/SIGINT handled cleanly

---

## Deployment (VPS / Railway / Render)

```bash
# Build
pnpm build

# Set production env vars, then:
node dist/index.js
```

Or use the `Dockerfile` with any container platform (Railway, Render, Fly.io, DigitalOcean App Platform).
