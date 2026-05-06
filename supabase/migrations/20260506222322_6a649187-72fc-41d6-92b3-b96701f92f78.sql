alter table public.follow_ups
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists context_notes text;