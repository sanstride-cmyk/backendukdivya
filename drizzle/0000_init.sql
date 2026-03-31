-- Connect Marketing Solutions — Initial Schema
-- Run: psql $DATABASE_URL -f drizzle/0000_init.sql

CREATE TYPE lead_source AS ENUM ('contact_form', 'popup', 'chatbot', 'whatsapp', 'other');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(50),
  message         TEXT NOT NULL,
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  email_sent      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_email_idx      ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS contact_created_at_idx ON contact_submissions(created_at);

-- Leads (popup, chatbot, WhatsApp, etc.)
CREATE TABLE IF NOT EXISTS leads (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  phone               VARCHAR(50),
  interested_service  VARCHAR(255),
  source              lead_source NOT NULL,
  status              lead_status NOT NULL DEFAULT 'new',
  ip_address          VARCHAR(45),
  notes               TEXT,
  email_sent          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_email_idx      ON leads(email);
CREATE INDEX IF NOT EXISTS lead_status_idx     ON leads(status);
CREATE INDEX IF NOT EXISTS lead_source_idx     ON leads(source);
CREATE INDEX IF NOT EXISTS lead_created_at_idx ON leads(created_at);

-- Chatbot sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id                  SERIAL PRIMARY KEY,
  session_id          VARCHAR(36) NOT NULL UNIQUE,
  name                VARCHAR(255),
  email               VARCHAR(255),
  phone               VARCHAR(50),
  interested_service  VARCHAR(255),
  completed           BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address          VARCHAR(45),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_session_id_idx ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS chat_completed_idx  ON chat_sessions(completed);
