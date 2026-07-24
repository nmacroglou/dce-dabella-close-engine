
-- ═══════════════════════════════════════════════════════════════
-- Property Intelligence module
-- ═══════════════════════════════════════════════════════════════

-- ── properties ──────────────────────────────────────────────────
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  standardized_address TEXT NOT NULL,
  parcel_number TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  property_type TEXT,
  year_built INTEGER,
  square_feet INTEGER,
  lot_size NUMERIC,
  stories INTEGER,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  assessed_value NUMERIC,
  estimated_market_value NUMERIC,
  roof_material TEXT,
  estimated_roof_age INTEGER,
  exterior_material TEXT,
  solar_present BOOLEAN,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX properties_created_by_idx ON public.properties(created_by);
CREATE INDEX properties_parcel_idx ON public.properties(parcel_number);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "properties_select" ON public.properties FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "properties_insert" ON public.properties FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "properties_update" ON public.properties FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "properties_delete" ON public.properties FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── property_ownership_records ──────────────────────────────────
CREATE TABLE public.property_ownership_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_name TEXT,
  owner_type TEXT,
  tax_mailing_name TEXT,
  tax_mailing_address TEXT,
  tax_mailing_matches_property BOOLEAN,
  ownership_start_date DATE,
  ownership_end_date DATE,
  document_type TEXT,
  recording_number TEXT,
  source TEXT,
  source_record_date DATE,
  confidence_score INTEGER,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ownership_property_idx ON public.property_ownership_records(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_ownership_records TO authenticated;
GRANT ALL ON public.property_ownership_records TO service_role;
ALTER TABLE public.property_ownership_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ownership_rw" ON public.property_ownership_records FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- ── property_sale_records ───────────────────────────────────────
CREATE TABLE public.property_sale_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sale_date DATE,
  buyer_name TEXT,
  seller_name TEXT,
  sale_price NUMERIC,
  document_type TEXT,
  recording_number TEXT,
  source TEXT,
  confidence_score INTEGER,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sale_property_idx ON public.property_sale_records(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_sale_records TO authenticated;
GRANT ALL ON public.property_sale_records TO service_role;
ALTER TABLE public.property_sale_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_rw" ON public.property_sale_records FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- ── property_identity_assessments ───────────────────────────────
CREATE TABLE public.property_identity_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  likely_owner_name TEXT,
  likely_occupant_name TEXT,
  owner_occupancy_status TEXT,
  confidence_score INTEGER,
  confidence_label TEXT,
  supporting_reasons_json JSONB DEFAULT '[]'::jsonb,
  conflicting_reasons_json JSONB DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX identity_property_idx ON public.property_identity_assessments(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_identity_assessments TO authenticated;
GRANT ALL ON public.property_identity_assessments TO service_role;
ALTER TABLE public.property_identity_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "identity_rw" ON public.property_identity_assessments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- ── property_intelligence ───────────────────────────────────────
CREATE TABLE public.property_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  property_match_confidence INTEGER,
  owner_confidence INTEGER,
  buyer_confidence INTEGER,
  occupancy_confidence INTEGER,
  profile_confidence INTEGER,
  data_sources_json JSONB DEFAULT '[]'::jsonb,
  missing_fields_json JSONB DEFAULT '[]'::jsonb,
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX pi_property_idx ON public.property_intelligence(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_intelligence TO authenticated;
GRANT ALL ON public.property_intelligence TO service_role;
ALTER TABLE public.property_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi_rw" ON public.property_intelligence FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- ── opportunity_scores ──────────────────────────────────────────
CREATE TABLE public.opportunity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  total_score INTEGER,
  priority TEXT,
  primary_product TEXT,
  secondary_product TEXT,
  recommendation_confidence INTEGER,
  explanation_json JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX opp_property_idx ON public.opportunity_scores(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_scores TO authenticated;
GRANT ALL ON public.opportunity_scores TO service_role;
ALTER TABLE public.opportunity_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opp_rw" ON public.opportunity_scores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- ── property_confirmations ──────────────────────────────────────
CREATE TABLE public.property_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  source_value TEXT,
  confirmed_value TEXT,
  confirmation_status TEXT NOT NULL,
  notes TEXT,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX conf_property_idx ON public.property_confirmations(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_confirmations TO authenticated;
GRANT ALL ON public.property_confirmations TO service_role;
ALTER TABLE public.property_confirmations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conf_rw" ON public.property_confirmations FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid());

-- ── suppressions (Do Not Knock) ─────────────────────────────────
CREATE TABLE public.suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  suppression_type TEXT NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX supp_property_idx ON public.suppressions(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppressions TO authenticated;
GRANT ALL ON public.suppressions TO service_role;
ALTER TABLE public.suppressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supp_select" ON public.suppressions FOR SELECT TO authenticated USING (true);
CREATE POLICY "supp_insert" ON public.suppressions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "supp_admin_mut" ON public.suppressions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── pi_audit_logs ───────────────────────────────────────────────
CREATE TABLE public.pi_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_user_idx ON public.pi_audit_logs(user_id);
GRANT SELECT, INSERT ON public.pi_audit_logs TO authenticated;
GRANT ALL ON public.pi_audit_logs TO service_role;
ALTER TABLE public.pi_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_insert_own" ON public.pi_audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "audit_select_own" ON public.pi_audit_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
