-- NearFix Schema
-- Run this entire file in the Supabase SQL Editor

-- ============================================================
-- 1. Create the reports table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_code   TEXT UNIQUE NOT NULL,          -- e.g. NF-2610-A7K2P
  description   TEXT NOT NULL,
  photo_url     TEXT NOT NULL,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  address       TEXT,
  status        TEXT NOT NULL DEFAULT 'submitted'
                CHECK (status IN ('submitted', 'under_review', 'in_progress', 'resolved')),
  priority      TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Auto-update updated_at on row changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.reports;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 3. Row Level Security
-- ============================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous users) can SELECT reports
CREATE POLICY "Public read access"
  ON public.reports
  FOR SELECT
  USING (true);

-- Anyone (including anonymous users) can INSERT a new report
CREATE POLICY "Public insert access"
  ON public.reports
  FOR INSERT
  WITH CHECK (true);

-- No public UPDATE or DELETE — handled only by service-role / admins

-- ============================================================
-- 4. Storage bucket for report photos
-- ============================================================
-- Run in SQL editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: allow anon uploads
CREATE POLICY "Allow anon uploads"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'report-photos');

-- Storage RLS: allow public reads
CREATE POLICY "Allow public reads"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'report-photos');
