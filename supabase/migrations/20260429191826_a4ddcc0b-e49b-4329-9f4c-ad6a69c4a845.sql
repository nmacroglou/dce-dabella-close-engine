-- Per-rep editable commission grid (% of Project Price -> Commission %)
CREATE TABLE public.commission_grids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL,
  tiers jsonb NOT NULL DEFAULT '[
    {"min_pop": 75, "commission_pct": 5},
    {"min_pop": 80, "commission_pct": 7},
    {"min_pop": 85, "commission_pct": 9},
    {"min_pop": 90, "commission_pct": 10},
    {"min_pop": 95, "commission_pct": 11},
    {"min_pop": 100, "commission_pct": 12}
  ]'::jsonb,
  front_end_pct numeric NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rep_id)
);

ALTER TABLE public.commission_grids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps view own grid" ON public.commission_grids
  FOR SELECT USING (auth.uid() = rep_id);
CREATE POLICY "Reps insert own grid" ON public.commission_grids
  FOR INSERT WITH CHECK (auth.uid() = rep_id);
CREATE POLICY "Reps update own grid" ON public.commission_grids
  FOR UPDATE USING (auth.uid() = rep_id);

CREATE TRIGGER commission_grids_updated_at
  BEFORE UPDATE ON public.commission_grids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-deal commission sheet inputs (formulas live in code, inputs persist here)
ALTER TABLE public.deals
  ADD COLUMN commission_sheet jsonb NOT NULL DEFAULT '{
    "date_of_sale": null,
    "job_number": null,
    "rep_last_first": null,
    "project_price": 0,
    "contract_roof": 0,
    "contract_siding": 0,
    "contract_gutters": 0,
    "project_roof": 0,
    "project_siding": 0,
    "project_gutters": 0,
    "company_paid_finance_fees": 0,
    "promotion_note": "",
    "bonus_self_gen_fee": 0,
    "dollar_for_dollar": 0,
    "rep1_pct": 100,
    "rep2_pct": 0
  }'::jsonb;