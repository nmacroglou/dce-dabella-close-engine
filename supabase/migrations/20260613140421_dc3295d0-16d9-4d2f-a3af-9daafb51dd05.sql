ALTER TYPE public.deal_stage ADD VALUE IF NOT EXISTS 'disqualified';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS disqualified_reason text;