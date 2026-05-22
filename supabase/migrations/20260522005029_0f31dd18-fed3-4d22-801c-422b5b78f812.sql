
CREATE TABLE IF NOT EXISTS public.utility_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utility text NOT NULL CHECK (utility IN ('SRP','APS','TEP')),
  title text NOT NULL,
  summary text,
  category text NOT NULL DEFAULT 'announcement' CHECK (category IN ('rate_change','regulation','outage','announcement','program','other')),
  impact text DEFAULT 'neutral' CHECK (impact IN ('up','down','neutral')),
  source_url text NOT NULL,
  source_name text,
  published_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (utility, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_utility_updates_utility_published ON public.utility_updates (utility, published_at DESC NULLS LAST, fetched_at DESC);

ALTER TABLE public.utility_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view utility updates"
  ON public.utility_updates FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS public.utility_refresh_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','partial','error')),
  items_added integer NOT NULL DEFAULT 0,
  items_total integer NOT NULL DEFAULT 0,
  error text
);

ALTER TABLE public.utility_refresh_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view refresh runs"
  ON public.utility_refresh_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
