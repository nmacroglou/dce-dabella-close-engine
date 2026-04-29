DROP TRIGGER IF EXISTS deals_stage_change ON public.deals;
DROP TRIGGER IF EXISTS handle_deal_stage_change_trigger ON public.deals;
DROP TRIGGER IF EXISTS trg_deal_stage_change ON public.deals;
DROP TRIGGER IF EXISTS deals_handle_stage_change ON public.deals;
DROP TRIGGER IF EXISTS deals_stage_change_trigger ON public.deals;

DROP TRIGGER IF EXISTS deals_set_stage_timestamps_biu ON public.deals;
DROP TRIGGER IF EXISTS deals_write_stage_history_aiu ON public.deals;

CREATE TRIGGER deals_set_stage_timestamps_biu
BEFORE INSERT OR UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.deals_set_stage_timestamps();

CREATE TRIGGER deals_write_stage_history_aiu
AFTER INSERT OR UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.deals_write_stage_history();

REVOKE EXECUTE ON FUNCTION public.deals_set_stage_timestamps() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deals_write_stage_history() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_deal_stage_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;