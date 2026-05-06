ALTER TABLE public.commission_grids
  ADD COLUMN IF NOT EXISTS promos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS monthly_bonus_tiers jsonb NOT NULL DEFAULT '[
    {"min_nis": 75000, "pct": 1.0},
    {"min_nis": 100000, "pct": 1.25},
    {"min_nis": 125000, "pct": 1.5},
    {"min_nis": 150000, "pct": 1.75},
    {"min_nis": 175000, "pct": 2.0},
    {"min_nis": 200000, "pct": 2.5}
  ]'::jsonb;