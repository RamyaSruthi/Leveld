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

-- ── job_applications ───────────────────────────────────────────────────────────

CREATE TYPE application_status AS ENUM (
  'applied', 'screening', 'interviewing', 'offer', 'rejected', 'withdrawn'
);

CREATE TYPE round_outcome AS ENUM ('pending', 'passed', 'failed');

CREATE TABLE IF NOT EXISTS public.job_applications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company         TEXT NOT NULL,
  role            TEXT NOT NULL,
  status          application_status NOT NULL DEFAULT 'applied',
  applied_at      DATE DEFAULT CURRENT_DATE,
  job_url         TEXT,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_linkedin TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own applications" ON public.job_applications
  FOR ALL USING (auth.uid() = user_id);

-- ── interview_rounds ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.interview_rounds (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id  UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  scheduled_at    TIMESTAMPTZ,
  outcome         round_outcome NOT NULL DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.interview_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rounds" ON public.interview_rounds
  FOR ALL USING (auth.uid() = user_id);

-- ── pillars (user-customisable pillar definitions) ──────────────────────────

CREATE TABLE IF NOT EXISTS public.pillars (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  label       TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6c5ce7',
  order_index INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, slug)
);

ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pillars" ON public.pillars
  FOR ALL USING (auth.uid() = user_id);

-- Migrate topics.pillar from enum to text so custom pillar slugs work
ALTER TABLE public.topics ALTER COLUMN pillar TYPE TEXT USING pillar::TEXT;

-- ── resources ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.resources (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN ('book', 'article', 'repo', 'course')),
  title       TEXT NOT NULL,
  url         TEXT,
  description TEXT,
  pillar_slug TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own resources" ON public.resources
  FOR ALL USING (auth.uid() = user_id);

-- ── mindset_entries ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mindset_entries (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mindset_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mindset entries" ON public.mindset_entries
  FOR ALL USING (auth.uid() = user_id);
