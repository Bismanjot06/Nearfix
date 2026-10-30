-- NearFix Migration 003: City Column & Service Area Backfill
-- Adds nullable city column to reports and backfills existing rows for Ludhiana and Amritsar.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS city TEXT;

-- Backfill existing rows using the official service area coordinates
UPDATE public.reports
SET city = CASE
  -- Ludhiana: lat 30.6710 - 31.1310, lng 75.5873 - 76.1273
  WHEN latitude >= 30.6710 AND latitude <= 31.1310 AND longitude >= 75.5873 AND longitude <= 76.1273 THEN 'Ludhiana'
  -- Amritsar: lat 31.4040 - 31.8640, lng 74.6023 - 75.1423
  WHEN latitude >= 31.4040 AND latitude <= 31.8640 AND longitude >= 74.6023 AND longitude <= 75.1423 THEN 'Amritsar'
  -- Rows outside both service areas remain NULL until manually classified.
  ELSE NULL
END
WHERE city IS NULL;

CREATE INDEX IF NOT EXISTS idx_reports_city ON public.reports (city);
