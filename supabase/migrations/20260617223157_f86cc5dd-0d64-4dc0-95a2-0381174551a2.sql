
-- 1) deal_inspections table
CREATE TABLE public.deal_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('roof','windows','bath','solar')),
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, report_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_inspections TO authenticated;
GRANT ALL ON public.deal_inspections TO service_role;

ALTER TABLE public.deal_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps manage inspections on own deals"
  ON public.deal_inspections FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_inspections.deal_id AND d.rep_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_inspections.deal_id AND d.rep_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER trg_deal_inspections_updated_at
  BEFORE UPDATE ON public.deal_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) extend deal_photos
ALTER TABLE public.deal_photos
  ADD COLUMN IF NOT EXISTS inspection_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS severity text CHECK (severity IN ('low','moderate','high')),
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS include_in_report boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inspection_report_type text CHECK (inspection_report_type IN ('roof','windows','bath','solar'));

CREATE INDEX IF NOT EXISTS idx_deal_photos_deal_inspection ON public.deal_photos(deal_id, inspection_report_type);
