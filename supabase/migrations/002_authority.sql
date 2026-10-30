-- NearFix Migration 002: Authority Workflow, Profiles, History & Transparent Priority
-- Safe to run on existing NearFix database without data loss.

-- ============================================================
-- 1. Profiles table & helper function
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'authority', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if current user is authority or admin
CREATE OR REPLACE FUNCTION public.is_authority()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('authority', 'admin')
  );
$$;

-- Profiles RLS:
-- 1. Users can read their own profile; Authority/Admin can read all profiles
DROP POLICY IF EXISTS "Read own profile or authority read all" ON public.profiles;
CREATE POLICY "Read own profile or authority read all"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_authority());

-- 2. Users can update their own profile name, but CANNOT update role
DROP POLICY IF EXISTS "Update own profile non-role" ON public.profiles;
CREATE POLICY "Update own profile non-role"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Auto-create profile trigger on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'citizen'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. Migrate existing status values & add columns to `reports`
-- ============================================================

-- First remove old status check constraint if exists
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;

-- Migrate existing rows to new statuses
UPDATE public.reports SET status = 'verified' WHERE status = 'under_review';
UPDATE public.reports SET status = 'repaired' WHERE status = 'resolved';

-- Add new status check constraint
ALTER TABLE public.reports ADD CONSTRAINT reports_status_check
  CHECK (status IN ('submitted', 'verified', 'assigned', 'in_progress', 'repaired', 'rejected'));

-- Add new columns safely
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reported_severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (reported_severity IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS traffic_level TEXT
    CHECK (traffic_level IS NULL OR traffic_level IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS near_sensitive_location TEXT,
  ADD COLUMN IF NOT EXISTS priority_score INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS priority_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS priority_overridden BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS overridden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS repair_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS closure_note TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- ============================================================
-- 3. Report History Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  old_status  TEXT,
  new_status  TEXT NOT NULL,
  changed_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_history_report_id ON public.report_history(report_id);

ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- Anyone can read report history (needed for citizen tracking page)
DROP POLICY IF EXISTS "Public read report history" ON public.report_history;
CREATE POLICY "Public read report history"
  ON public.report_history
  FOR SELECT
  USING (true);

-- No direct client insert/update/delete on report_history (trigger only)

-- ============================================================
-- 4. Status Transition Enforcement & History Triggers
-- ============================================================

-- Function to validate status transitions and populate history
CREATE OR REPLACE FUNCTION public.handle_report_status_and_history()
RETURNS TRIGGER AS $$
DECLARE
  v_note TEXT;
BEGIN
  -- 1. On INSERT: enforce submitted status and default priority for citizens
  IF (TG_OP = 'INSERT') THEN
    NEW.status := 'submitted';
    NEW.priority_overridden := false;
    NEW.override_reason := null;
    NEW.overridden_by := null;
    NEW.repair_photo_url := null;
    NEW.closure_note := null;
    NEW.rejection_reason := null;
    NEW.verified_at := null;
    NEW.resolved_at := null;

    -- Write initial history row
    INSERT INTO public.report_history (report_id, old_status, new_status, changed_by, note)
    VALUES (NEW.id, NULL, 'submitted', auth.uid(), 'Report submitted by citizen');

    RETURN NEW;
  END IF;

  -- 2. On UPDATE: check status transition validity
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Allowed transitions:
    -- submitted -> verified | rejected
    -- verified -> assigned
    -- assigned -> in_progress
    -- in_progress -> repaired
    -- rejected -> submitted (re-opening rejected report)
    IF NOT (
      (OLD.status = 'submitted' AND NEW.status IN ('verified', 'rejected')) OR
      (OLD.status = 'verified' AND NEW.status = 'assigned') OR
      (OLD.status = 'assigned' AND NEW.status = 'in_progress') OR
      (OLD.status = 'in_progress' AND NEW.status = 'repaired') OR
      (OLD.status = 'rejected' AND NEW.status = 'submitted')
    ) THEN
      RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
    END IF;

    -- Set timestamps
    IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
      NEW.verified_at := now();
    ELSIF NEW.status = 'repaired' AND OLD.status != 'repaired' THEN
      NEW.resolved_at := now();
    END IF;

    -- Rejection requires reason
    IF NEW.status = 'rejected' AND (NEW.rejection_reason IS NULL OR trim(NEW.rejection_reason) = '') THEN
      RAISE EXCEPTION 'A rejection reason is required when rejecting a report';
    END IF;

    -- Construct note for history
    IF NEW.status = 'rejected' THEN
      v_note := COALESCE(NEW.rejection_reason, 'Report rejected by authority');
    ELSIF NEW.status = 'repaired' THEN
      v_note := COALESCE(NEW.closure_note, 'Pothole repaired and closed');
    ELSIF NEW.status = 'submitted' AND OLD.status = 'rejected' THEN
      v_note := 'Report reopened by authority';
    ELSE
      v_note := 'Status updated to ' || NEW.status;
    END IF;

    INSERT INTO public.report_history (report_id, old_status, new_status, changed_by, note)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), v_note);
  END IF;

  -- 3. On UPDATE: log priority changes to history if status didn't change
  IF (TG_OP = 'UPDATE' AND OLD.priority IS DISTINCT FROM NEW.priority AND OLD.status = NEW.status) THEN
    IF NEW.priority_overridden THEN
      v_note := 'Priority manually overridden to ' || NEW.priority || ': ' || COALESCE(NEW.override_reason, 'No reason given');
    ELSE
      v_note := 'Priority recalculated to ' || NEW.priority;
    END IF;

    INSERT INTO public.report_history (report_id, old_status, new_status, changed_by, note)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), v_note);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_report_status_and_history ON public.reports;
CREATE TRIGGER trigger_report_status_and_history
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_report_status_and_history();

-- ============================================================
-- 5. Update Reports RLS
-- ============================================================
-- Keep public SELECT and INSERT, but restrict UPDATE to authority/admin
DROP POLICY IF EXISTS "Public update access" ON public.reports;
DROP POLICY IF EXISTS "Authority update access" ON public.reports;

CREATE POLICY "Authority update access"
  ON public.reports
  FOR UPDATE
  USING (public.is_authority())
  WITH CHECK (public.is_authority());

-- ============================================================
-- 6. Storage Bucket for repair-photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('repair-photos', 'repair-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for repair-photos: public read, authority insert
DROP POLICY IF EXISTS "Allow public reads repair photos" ON storage.objects;
CREATE POLICY "Allow public reads repair photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'repair-photos');

DROP POLICY IF EXISTS "Allow authority uploads repair photos" ON storage.objects;
CREATE POLICY "Allow authority uploads repair photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'repair-photos' AND public.is_authority());
