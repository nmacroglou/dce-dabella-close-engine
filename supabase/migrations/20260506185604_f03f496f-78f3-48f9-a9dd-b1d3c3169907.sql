-- Add follow-up SLA config per rep (hours/days for touchpoints)
ALTER TABLE public.commission_grids
ADD COLUMN IF NOT EXISTS follow_up_sla jsonb NOT NULL DEFAULT '{"touchpoints":[{"label":"First touch","offset_hours":24},{"label":"Second touch","offset_hours":72},{"label":"Third touch","offset_hours":168}]}'::jsonb;

-- Follow-ups table: one row per scheduled touchpoint
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  rep_id uuid NOT NULL,
  touchpoint_number int NOT NULL DEFAULT 1,
  due_at timestamptz NOT NULL,
  completed_at timestamptz,
  channel text,
  notes text,
  ai_email_subject text,
  ai_email_body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own follow-ups" ON public.follow_ups
  FOR SELECT USING (auth.uid() = rep_id);
CREATE POLICY "Reps insert own follow-ups" ON public.follow_ups
  FOR INSERT WITH CHECK (auth.uid() = rep_id);
CREATE POLICY "Reps update own follow-ups" ON public.follow_ups
  FOR UPDATE USING (auth.uid() = rep_id);
CREATE POLICY "Reps delete own follow-ups" ON public.follow_ups
  FOR DELETE USING (auth.uid() = rep_id);

CREATE TRIGGER update_follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_follow_ups_rep_due ON public.follow_ups (rep_id, due_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_deal ON public.follow_ups (deal_id);