
CREATE TABLE public.coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  rep_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  transcript text NOT NULL DEFAULT '',
  summary text,
  next_steps jsonb,
  detected_objections jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coaching_sessions TO authenticated;
GRANT ALL ON public.coaching_sessions TO service_role;

ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps manage own coaching sessions"
  ON public.coaching_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = rep_id)
  WITH CHECK (auth.uid() = rep_id);

CREATE POLICY "Admins view all coaching sessions"
  ON public.coaching_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_coaching_sessions_rep ON public.coaching_sessions(rep_id, started_at DESC);
CREATE INDEX idx_coaching_sessions_deal ON public.coaching_sessions(deal_id);

CREATE TRIGGER trg_coaching_sessions_updated
  BEFORE UPDATE ON public.coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
