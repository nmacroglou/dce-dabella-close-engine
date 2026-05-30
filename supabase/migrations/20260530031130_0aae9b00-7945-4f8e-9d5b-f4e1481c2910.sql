-- =========================================================
-- Enums
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.incident_severity AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.incident_status AS ENUM ('open','in_progress','waiting_external','blocked','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.incident_type AS ENUM (
    'incomplete_paperwork',
    'audit_item',
    'change_order',
    'addendum',
    'refund',
    'deposit_issue',
    'missing_poi',
    'fraud_alert',
    'cancel_decline',
    'approval_pending',
    'ownership_stip',
    'roof_packet',
    'deal_update',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.incident_source AS ENUM ('email','phone','text','portal','in_person','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- deal_incidents
-- =========================================================
CREATE TABLE public.deal_incidents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id          uuid NOT NULL,
  deal_id         uuid,                  -- optional link to a deal
  job_number      text,
  customer_name   text,
  title           text NOT NULL,
  details         text,
  incident_type   public.incident_type      NOT NULL DEFAULT 'other',
  severity        public.incident_severity  NOT NULL DEFAULT 'medium',
  status          public.incident_status    NOT NULL DEFAULT 'open',
  source          public.incident_source    NOT NULL DEFAULT 'email',
  assignee        text,
  email_subject   text,
  email_link      text,
  tags            text[] NOT NULL DEFAULT ARRAY[]::text[],
  attachments     jsonb  NOT NULL DEFAULT '[]'::jsonb,
  due_at          timestamptz,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_incidents_rep        ON public.deal_incidents (rep_id);
CREATE INDEX idx_deal_incidents_deal       ON public.deal_incidents (deal_id);
CREATE INDEX idx_deal_incidents_status     ON public.deal_incidents (status);
CREATE INDEX idx_deal_incidents_job_number ON public.deal_incidents (job_number);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_incidents TO authenticated;
GRANT ALL ON public.deal_incidents TO service_role;

ALTER TABLE public.deal_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own incidents"
  ON public.deal_incidents FOR SELECT
  USING (auth.uid() = rep_id);

CREATE POLICY "Admins view all incidents"
  ON public.deal_incidents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Reps insert own incidents"
  ON public.deal_incidents FOR INSERT
  WITH CHECK (auth.uid() = rep_id);

CREATE POLICY "Reps update own incidents"
  ON public.deal_incidents FOR UPDATE
  USING (auth.uid() = rep_id);

CREATE POLICY "Reps delete own incidents"
  ON public.deal_incidents FOR DELETE
  USING (auth.uid() = rep_id);

-- Auto-update timestamp & manage resolved_at
CREATE OR REPLACE FUNCTION public.deal_incidents_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status = 'resolved' AND OLD.status IS DISTINCT FROM 'resolved' THEN
    NEW.resolved_at := COALESCE(NEW.resolved_at, now());
  ELSIF NEW.status <> 'resolved' THEN
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_deal_incidents_touch
BEFORE UPDATE ON public.deal_incidents
FOR EACH ROW EXECUTE FUNCTION public.deal_incidents_touch();

-- =========================================================
-- deal_incident_notes
-- =========================================================
CREATE TABLE public.deal_incident_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id  uuid NOT NULL REFERENCES public.deal_incidents(id) ON DELETE CASCADE,
  rep_id       uuid NOT NULL,
  body         text NOT NULL,
  attachments  jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_incident_notes_incident ON public.deal_incident_notes (incident_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_incident_notes TO authenticated;
GRANT ALL ON public.deal_incident_notes TO service_role;

ALTER TABLE public.deal_incident_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own incident notes"
  ON public.deal_incident_notes FOR SELECT
  USING (auth.uid() = rep_id);

CREATE POLICY "Admins view all incident notes"
  ON public.deal_incident_notes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Reps insert own incident notes"
  ON public.deal_incident_notes FOR INSERT
  WITH CHECK (auth.uid() = rep_id);

CREATE POLICY "Reps delete own incident notes"
  ON public.deal_incident_notes FOR DELETE
  USING (auth.uid() = rep_id);

-- =========================================================
-- Storage bucket (private)
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-attachments', 'incident-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Reps read own incident attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'incident-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins read all incident attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'incident-attachments'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Reps upload own incident attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'incident-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Reps delete own incident attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'incident-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );