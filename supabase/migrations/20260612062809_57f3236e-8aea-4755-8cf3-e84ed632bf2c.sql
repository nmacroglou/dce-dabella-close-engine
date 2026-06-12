CREATE TABLE public.paycheck_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL,
  payday_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rep_id, payday_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.paycheck_overrides TO authenticated;
GRANT ALL ON public.paycheck_overrides TO service_role;

ALTER TABLE public.paycheck_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps manage their own paycheck overrides"
  ON public.paycheck_overrides FOR ALL
  USING (auth.uid() = rep_id)
  WITH CHECK (auth.uid() = rep_id);

CREATE POLICY "Admins view all paycheck overrides"
  ON public.paycheck_overrides FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER paycheck_overrides_touch
  BEFORE UPDATE ON public.paycheck_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX paycheck_overrides_rep_date_idx ON public.paycheck_overrides (rep_id, payday_date);
