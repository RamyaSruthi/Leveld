-- Leveld — Phase 1 Database Migration
-- Run this in the Supabase SQL Editor

-- ── Enum types ────────────────────────────────────────────────────────────────

CREATE TYPE pillar_type AS ENUM (
  'dsa', 'hld', 'lld', 'tech_stack', 'theory', 'behavioral', 'projects'
);

CREATE TYPE topic_status AS ENUM ('not_started', 'in_progress', 'done');

CREATE TYPE mock_score AS ENUM ('weak', 'acceptable', 'strong');

-- ── users ─────────────────────────────────────────────────────────────────────

-- Extends Supabase auth.users with app-specific profile data.
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT,
  target_companies TEXT[],
  timeline_months  INT,
  start_date       DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Auto-create profile row on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── topics ────────────────────────────────────────────────────────────────────

-- Global curriculum (shared across all users). Seeded, not user-owned.
CREATE TABLE IF NOT EXISTS public.topics (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pillar      pillar_type NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_custom   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Anyone can read topics; only service role can write (via seed script).
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics are publicly readable" ON public.topics
  FOR SELECT USING (true);

-- ── user_topics ───────────────────────────────────────────────────────────────

-- Per-user progress + spaced-repetition state for each topic.
CREATE TABLE IF NOT EXISTS public.user_topics (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id        UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  status          topic_status NOT NULL DEFAULT 'not_started',
  review_count    INT NOT NULL DEFAULT 0,
  -- SM-2 fields
  easiness_factor FLOAT NOT NULL DEFAULT 2.5,
  interval_days   INT NOT NULL DEFAULT 1,
  last_studied_at TIMESTAMPTZ,
  next_review_at  TIMESTAMPTZ,
  UNIQUE (user_id, topic_id)
);

ALTER TABLE public.user_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own topic progress" ON public.user_topics
  FOR ALL USING (auth.uid() = user_id);

-- ── notes ─────────────────────────────────────────────────────────────────────

-- Versioned notes: each save creates a new row; all versions are kept.
CREATE TABLE IF NOT EXISTS public.notes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id   UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  version    INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.notes
  FOR ALL USING (auth.uid() = user_id);

-- Helpful index for fetching the latest note per topic
CREATE INDEX IF NOT EXISTS notes_user_topic_version
  ON public.notes (user_id, topic_id, version DESC);

-- ── ai_reviews ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_reviews (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id             UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gaps                TEXT[],
  expected_questions  TEXT[],
  next_topics         TEXT[],
  raw_response        TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own AI reviews" ON public.ai_reviews
  FOR ALL USING (auth.uid() = user_id);

-- ── mock_sessions ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mock_sessions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id     UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  question     TEXT NOT NULL,
  user_answer  TEXT,
  score        mock_score,
  feedback     TEXT,
  model_answer TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mock_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mock sessions" ON public.mock_sessions
  FOR ALL USING (auth.uid() = user_id);
