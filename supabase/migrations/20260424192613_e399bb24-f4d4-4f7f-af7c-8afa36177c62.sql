-- Add optional note column to capture context when a stage changes
ALTER TABLE public.deal_stage_history
ADD COLUMN note text;

-- Update the stage-change trigger so callers can pass a note via a session-local GUC.
-- The app sets `app.stage_note` immediately before updating deals.stage,
-- the trigger reads it once and then resets it.
CREATE OR REPLACE FUNCTION public.handle_deal_stage_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_note text;
BEGIN
  -- Read optional note from session config; ignore if unset
  BEGIN
    v_note := NULLIF(current_setting('app.stage_note', true), '');
  EXCEPTION WHEN OTHERS THEN
    v_note := NULL;
  END;

  IF (TG_OP = 'INSERT') THEN
    NEW.stage_changed_at := now();
    INSERT INTO public.deal_stage_history (deal_id, rep_id, from_stage, to_stage, note)
    VALUES (NEW.id, NEW.rep_id, NULL, NEW.stage, v_note);
    IF NEW.stage IN ('won', 'lost') THEN
      NEW.closed_at := now();
    END IF;
    -- Clear so it doesn't leak to the next statement
    PERFORM set_config('app.stage_note', '', true);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) THEN
    NEW.stage_changed_at := now();
    INSERT INTO public.deal_stage_history (deal_id, rep_id, from_stage, to_stage, note)
    VALUES (NEW.id, NEW.rep_id, OLD.stage, NEW.stage, v_note);
    IF NEW.stage IN ('won', 'lost') AND OLD.stage NOT IN ('won', 'lost') THEN
      NEW.closed_at := now();
    ELSIF NEW.stage NOT IN ('won', 'lost') THEN
      NEW.closed_at := NULL;
    END IF;
    PERFORM set_config('app.stage_note', '', true);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$function$;

-- Allow reps to update notes on their own stage history entries (e.g. add note after the fact)
CREATE POLICY "Reps can update their own stage history notes"
ON public.deal_stage_history
FOR UPDATE
USING (auth.uid() = rep_id)
WITH CHECK (auth.uid() = rep_id);