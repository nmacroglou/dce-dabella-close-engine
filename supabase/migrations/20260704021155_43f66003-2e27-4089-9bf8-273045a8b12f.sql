ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS install_date date,
  ADD COLUMN IF NOT EXISTS install_notes text;

CREATE INDEX IF NOT EXISTS deals_install_date_idx ON public.deals(install_date) WHERE install_date IS NOT NULL;