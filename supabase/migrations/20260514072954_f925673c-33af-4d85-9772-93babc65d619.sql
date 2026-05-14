CREATE TABLE public.commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL,
  deal_id uuid,
  customer_name text,
  job_number text,
  sale_date date,
  expected_total numeric NOT NULL DEFAULT 0,
  expected_front numeric NOT NULL DEFAULT 0,
  expected_back numeric NOT NULL DEFAULT 0,
  front_paid_amount numeric NOT NULL DEFAULT 0,
  front_paid_at date,
  back_paid_amount numeric NOT NULL DEFAULT 0,
  back_paid_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own ledger" ON public.commission_payments
  FOR SELECT USING (auth.uid() = rep_id);
CREATE POLICY "Admins view all ledger" ON public.commission_payments
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Reps insert own ledger" ON public.commission_payments
  FOR INSERT WITH CHECK (auth.uid() = rep_id);
CREATE POLICY "Reps update own ledger" ON public.commission_payments
  FOR UPDATE USING (auth.uid() = rep_id);
CREATE POLICY "Reps delete own ledger" ON public.commission_payments
  FOR DELETE USING (auth.uid() = rep_id);

CREATE INDEX idx_commission_payments_rep ON public.commission_payments(rep_id);
CREATE INDEX idx_commission_payments_deal ON public.commission_payments(deal_id);

CREATE TRIGGER update_commission_payments_updated_at
  BEFORE UPDATE ON public.commission_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();