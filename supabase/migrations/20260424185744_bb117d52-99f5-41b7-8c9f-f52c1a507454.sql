
-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- TIMESTAMP TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DEAL STAGE ENUM
-- ============================================================
CREATE TYPE public.deal_stage AS ENUM (
  'inspecting',
  'presented',
  'follow_up',
  'won',
  'lost'
);

-- ============================================================
-- DEALS
-- ============================================================
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rep_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  homeowner1 TEXT,
  homeowner2 TEXT,
  address TEXT,
  notes TEXT,
  stage public.deal_stage NOT NULL DEFAULT 'inspecting',
  stage_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  lost_reason TEXT,
  selected_option TEXT,
  closed_amount NUMERIC,
  engine_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  products TEXT[] DEFAULT ARRAY[]::TEXT[],
  price_a NUMERIC,
  price_b NUMERIC,
  price_c NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_rep_id ON public.deals(rep_id);
CREATE INDEX idx_deals_stage ON public.deals(rep_id, stage);
CREATE INDEX idx_deals_created_at ON public.deals(rep_id, created_at DESC);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps can view their own deals"
  ON public.deals FOR SELECT USING (auth.uid() = rep_id);
CREATE POLICY "Reps can insert their own deals"
  ON public.deals FOR INSERT WITH CHECK (auth.uid() = rep_id);
CREATE POLICY "Reps can update their own deals"
  ON public.deals FOR UPDATE USING (auth.uid() = rep_id);
CREATE POLICY "Reps can delete their own deals"
  ON public.deals FOR DELETE USING (auth.uid() = rep_id);

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- DEAL STAGE HISTORY
-- ============================================================
CREATE TABLE public.deal_stage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_stage public.deal_stage,
  to_stage public.deal_stage NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_stage_history_deal ON public.deal_stage_history(deal_id);
CREATE INDEX idx_deal_stage_history_rep ON public.deal_stage_history(rep_id, changed_at DESC);

ALTER TABLE public.deal_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps can view their own stage history"
  ON public.deal_stage_history FOR SELECT USING (auth.uid() = rep_id);
CREATE POLICY "Reps can insert their own stage history"
  ON public.deal_stage_history FOR INSERT WITH CHECK (auth.uid() = rep_id);

CREATE OR REPLACE FUNCTION public.handle_deal_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    NEW.stage_changed_at := now();
    INSERT INTO public.deal_stage_history (deal_id, rep_id, from_stage, to_stage)
    VALUES (NEW.id, NEW.rep_id, NULL, NEW.stage);
    IF NEW.stage IN ('won', 'lost') THEN
      NEW.closed_at := now();
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) THEN
    NEW.stage_changed_at := now();
    INSERT INTO public.deal_stage_history (deal_id, rep_id, from_stage, to_stage)
    VALUES (NEW.id, NEW.rep_id, OLD.stage, NEW.stage);
    IF NEW.stage IN ('won', 'lost') AND OLD.stage NOT IN ('won', 'lost') THEN
      NEW.closed_at := now();
    ELSIF NEW.stage NOT IN ('won', 'lost') THEN
      NEW.closed_at := NULL;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER deals_stage_change_trigger
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.handle_deal_stage_change();

-- ============================================================
-- DEAL OBJECTIONS
-- ============================================================
CREATE TABLE public.deal_objections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objection_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_objections_deal ON public.deal_objections(deal_id);
CREATE INDEX idx_deal_objections_rep ON public.deal_objections(rep_id, created_at DESC);
CREATE INDEX idx_deal_objections_type ON public.deal_objections(rep_id, objection_type);

ALTER TABLE public.deal_objections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps can view their own deal objections"
  ON public.deal_objections FOR SELECT USING (auth.uid() = rep_id);
CREATE POLICY "Reps can insert their own deal objections"
  ON public.deal_objections FOR INSERT WITH CHECK (auth.uid() = rep_id);
CREATE POLICY "Reps can update their own deal objections"
  ON public.deal_objections FOR UPDATE USING (auth.uid() = rep_id);
CREATE POLICY "Reps can delete their own deal objections"
  ON public.deal_objections FOR DELETE USING (auth.uid() = rep_id);
