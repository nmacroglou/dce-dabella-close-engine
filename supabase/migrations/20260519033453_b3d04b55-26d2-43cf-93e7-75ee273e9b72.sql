-- Dedupe commission_payments: keep the row with the most paid info (or earliest) per (rep_id, deal_id)
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY rep_id, deal_id
      ORDER BY (COALESCE(front_paid_amount,0) + COALESCE(back_paid_amount,0)) DESC,
               created_at ASC
    ) AS rn
  FROM public.commission_payments
  WHERE deal_id IS NOT NULL
)
DELETE FROM public.commission_payments
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Prevent future duplicate auto-imports per deal
CREATE UNIQUE INDEX IF NOT EXISTS commission_payments_rep_deal_unique
  ON public.commission_payments (rep_id, deal_id)
  WHERE deal_id IS NOT NULL;