DROP TRIGGER IF EXISTS deals_stage_change ON public.deals;
DROP TRIGGER IF EXISTS handle_deal_stage_change_trigger ON public.deals;
DROP TRIGGER IF EXISTS trg_deal_stage_change ON public.deals;
DROP TRIGGER IF EXISTS deals_handle_stage_change ON public.deals;
DROP TRIGGER IF EXISTS deals_set_stage_timestamps_biu ON public.deals;
DROP TRIGGER IF EXISTS deals_write_stage_history_aiu ON public.deals;

CREATE OR REPLACE FUNCTION public.deals_set_stage_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    NEW.stage_changed_at := now();
    IF NEW.stage IN ('won','lost') THEN
      NEW.closed_at := now();
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) THEN
    NEW.stage_changed_at := now();
    IF NEW.stage IN ('won','lost') AND OLD.stage NOT IN ('won','lost') THEN
      NEW.closed_at := now();
    ELSIF NEW.stage NOT IN ('won','lost') THEN
      NEW.closed_at := NULL;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.deals_write_stage_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_note text;
BEGIN
  BEGIN
    v_note := NULLIF(current_setting('app.stage_note', true), '');
  EXCEPTION WHEN OTHERS THEN
    v_note := NULL;
  END;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.deal_stage_history (deal_id, rep_id, from_stage, to_stage, note)
    VALUES (NEW.id, NEW.rep_id, NULL, NEW.stage, v_note);
  ELSIF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) THEN
    INSERT INTO public.deal_stage_history (deal_id, rep_id, from_stage, to_stage, note)
    VALUES (NEW.id, NEW.rep_id, OLD.stage, NEW.stage, v_note);
  END IF;

  PERFORM set_config('app.stage_note', '', true);
  RETURN NULL;
END;
$$;

CREATE TRIGGER deals_set_stage_timestamps_biu
BEFORE INSERT OR UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.deals_set_stage_timestamps();

CREATE TRIGGER deals_write_stage_history_aiu
AFTER INSERT OR UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.deals_write_stage_history();