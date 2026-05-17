-- 1. Add preliminary_estimate jsonb column on deals
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS preliminary_estimate jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Deal photos table
CREATE TABLE IF NOT EXISTS public.deal_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  rep_id uuid NOT NULL,
  storage_path text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_photos_deal_id ON public.deal_photos(deal_id);

ALTER TABLE public.deal_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own deal photos"
  ON public.deal_photos FOR SELECT
  USING (auth.uid() = rep_id);

CREATE POLICY "Admins view all deal photos"
  ON public.deal_photos FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Reps insert own deal photos"
  ON public.deal_photos FOR INSERT
  WITH CHECK (auth.uid() = rep_id);

CREATE POLICY "Reps delete own deal photos"
  ON public.deal_photos FOR DELETE
  USING (auth.uid() = rep_id);

-- 3. Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-photos', 'deal-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS — folder structure is {rep_id}/{deal_id}/{filename}
CREATE POLICY "Reps view own deal photos storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'deal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Reps upload own deal photos storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'deal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Reps delete own deal photos storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'deal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins view all deal photos storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'deal-photos' AND has_role(auth.uid(), 'admin'::app_role));