CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('author', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_category AS ENUM (
    'royalty_payments',
    'isbn_metadata',
    'printing_quality',
    'distribution_availability',
    'book_status_production',
    'general_inquiry'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('pending', 'ai', 'default', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_status_type AS ENUM ('pending', 'done', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  author_code VARCHAR(32) UNIQUE NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NULL,
  city VARCHAR(100) NULL,
  role user_role NOT NULL DEFAULT 'author',
  password_hash VARCHAR(255) NOT NULL,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_email_lowercase CHECK (email = LOWER(email))
);

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  book_code VARCHAR(32) UNIQUE NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  isbn VARCHAR(64) NOT NULL,
  genre VARCHAR(100) NOT NULL,
  publication_date DATE NULL,
  status VARCHAR(100) NOT NULL,
  mrp NUMERIC(10, 2) NULL,
  author_royalty_per_copy NUMERIC(10, 2) NULL,
  total_copies_sold INTEGER NOT NULL DEFAULT 0,
  total_royalty_earned NUMERIC(10, 2) NOT NULL DEFAULT 0,
  royalty_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  royalty_pending NUMERIC(10, 2) NOT NULL DEFAULT 0,
  last_royalty_payout_date DATE NULL,
  print_partner VARCHAR(100) NULL,
  available_on TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  book_id INTEGER NULL REFERENCES books(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  attachment_name VARCHAR(255) NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  category ticket_category NOT NULL DEFAULT 'general_inquiry',
  category_source source_type NOT NULL DEFAULT 'pending',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  priority_source source_type NOT NULL DEFAULT 'pending',
  ai_status ai_status_type NOT NULL DEFAULT 'pending',
  ai_reason TEXT NULL,
  assigned_to INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS internal_notes (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_drafts (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  draft_text TEXT NOT NULL,
  model VARCHAR(100) NOT NULL,
  tokens_used INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_author_code ON users(author_code);
CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_book_code ON books(book_code);

CREATE INDEX IF NOT EXISTS idx_tickets_author_id ON tickets(author_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_queue_sort ON tickets(status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_internal_notes_ticket_id ON internal_notes(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_drafts_ticket_id ON ai_drafts(ticket_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_books_updated_at ON books;
CREATE TRIGGER trigger_books_updated_at
BEFORE UPDATE ON books
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_tickets_updated_at ON tickets;
CREATE TRIGGER trigger_tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
