-- Migration: 20260304123000_mrv_priority_recommendations_1_5.sql
-- Description: Implements priority recommendations 1-5 for MRV operational readiness.

-- 1) Baseline onboarding & ingestion job tracking
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL CHECK (job_type IN ('baseline_spatial', 'baseline_documents', 'project_area_upload')),
    source_name TEXT,
    source_file_name TEXT,
    source_sha256 TEXT,
    coastal_area_name TEXT,
    district_name TEXT,
    area_type TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    total_features INTEGER,
    inserted_features INTEGER,
    skipped_features INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON public.ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_job_type ON public.ingestion_jobs(job_type);

ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view ingestion jobs" ON public.ingestion_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert ingestion jobs" ON public.ingestion_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update ingestion jobs" ON public.ingestion_jobs FOR UPDATE TO authenticated USING (true);

-- 2) Audit-grade traceability
CREATE TABLE IF NOT EXISTS public.audit_log_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id TEXT,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    old_data JSONB,
    new_data JSONB,
    event_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_log_events_table ON public.audit_log_events(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_events_time ON public.audit_log_events(event_time DESC);

ALTER TABLE public.audit_log_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view audit log events" ON public.audit_log_events FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.evidence_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    document_id UUID,
    link_type TEXT NOT NULL DEFAULT 'supporting_evidence',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_evidence_links_entity ON public.evidence_links(entity_type, entity_id);

ALTER TABLE public.evidence_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view evidence links" ON public.evidence_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert evidence links" ON public.evidence_links FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_audit_event() RETURNS TRIGGER AS $$
DECLARE
    target_id TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_id := COALESCE(OLD.id::text, NULL);
        INSERT INTO public.audit_log_events(table_name, operation, record_id, changed_by, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, target_id, auth.uid(), to_jsonb(OLD), NULL);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        target_id := COALESCE(NEW.id::text, OLD.id::text, NULL);
        INSERT INTO public.audit_log_events(table_name, operation, record_id, changed_by, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, target_id, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSE
        target_id := COALESCE(NEW.id::text, NULL);
        INSERT INTO public.audit_log_events(table_name, operation, record_id, changed_by, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, target_id, auth.uid(), NULL, to_jsonb(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_project_areas_trigger ON public.project_areas;
CREATE TRIGGER audit_project_areas_trigger AFTER INSERT OR UPDATE OR DELETE ON public.project_areas
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_safeguard_documents_trigger ON public.safeguard_documents;
CREATE TRIGGER audit_safeguard_documents_trigger AFTER INSERT OR UPDATE OR DELETE ON public.safeguard_documents
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_grievances_trigger ON public.grievances;
CREATE TRIGGER audit_grievances_trigger AFTER INSERT OR UPDATE OR DELETE ON public.grievances
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_sar_change_alerts_trigger ON public.sar_change_alerts;
CREATE TRIGGER audit_sar_change_alerts_trigger AFTER INSERT OR UPDATE OR DELETE ON public.sar_change_alerts
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 3) 7-day classification operations data model
CREATE TABLE IF NOT EXISTS public.classification_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Queued' CHECK (status IN ('Queued', 'Running', 'Completed', 'Failed')),
    cadence_days INTEGER NOT NULL DEFAULT 7,
    source_platform TEXT NOT NULL DEFAULT 'Sentinel-1/2',
    model_name TEXT,
    model_version TEXT,
    area_of_interest TEXT,
    run_window_start DATE NOT NULL,
    run_window_end DATE NOT NULL,
    overall_accuracy NUMERIC(5,2),
    confusion_matrix JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_classification_runs_window ON public.classification_runs(run_window_end DESC);
CREATE INDEX IF NOT EXISTS idx_classification_runs_status ON public.classification_runs(status);

CREATE TABLE IF NOT EXISTS public.classification_map_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.classification_runs(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('classified_map', 'change_map', 'vector_change_polygons')),
    asset_url TEXT NOT NULL,
    published_layer_name TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_classification_map_assets_run_id ON public.classification_map_assets(run_id);

ALTER TABLE public.classification_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification_map_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view classification runs" ON public.classification_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert classification runs" ON public.classification_runs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update classification runs" ON public.classification_runs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view classification map assets" ON public.classification_map_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert classification map assets" ON public.classification_map_assets FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_classification_runs_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_classification_runs_updated_at ON public.classification_runs;
CREATE TRIGGER trg_update_classification_runs_updated_at
BEFORE UPDATE ON public.classification_runs
FOR EACH ROW EXECUTE FUNCTION public.update_classification_runs_updated_at();

-- 4) Permanent sample plot boundary polygons (optional footprints)
CREATE TABLE IF NOT EXISTS public.sample_plot_boundaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_plot_id UUID NOT NULL REFERENCES public.sample_plots(id) ON DELETE CASCADE,
    boundary_name TEXT,
    geom GEOMETRY(MultiPolygon, 4326) NOT NULL,
    area_ha NUMERIC(10,2),
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sample_plot_boundaries_geom ON public.sample_plot_boundaries USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_sample_plot_boundaries_plot ON public.sample_plot_boundaries(sample_plot_id);

ALTER TABLE public.sample_plot_boundaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to view sample plot boundaries" ON public.sample_plot_boundaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert sample plot boundaries" ON public.sample_plot_boundaries FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE VIEW public.geojson_sample_plot_boundaries WITH (security_invoker = on) AS
SELECT
    id,
    sample_plot_id,
    boundary_name,
    area_ha,
    valid_from,
    valid_to,
    created_at,
    ST_AsGeoJSON(geom)::jsonb AS geojson
FROM public.sample_plot_boundaries;

-- 5) Structured socioeconomic and environmental pressure observations
CREATE TABLE IF NOT EXISTS public.socio_economic_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coastal_area_name TEXT NOT NULL,
    community_name TEXT,
    indicator_code TEXT NOT NULL,
    indicator_name TEXT NOT NULL,
    observation_period_start DATE NOT NULL,
    observation_period_end DATE NOT NULL,
    value_numeric NUMERIC,
    value_text TEXT,
    unit TEXT,
    source_reference TEXT,
    verified_by TEXT,
    evidence_link_id UUID REFERENCES public.evidence_links(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_socio_economic_observations_area ON public.socio_economic_observations(coastal_area_name);
CREATE INDEX IF NOT EXISTS idx_socio_economic_observations_indicator ON public.socio_economic_observations(indicator_code);

CREATE TABLE IF NOT EXISTS public.environmental_pressure_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coastal_area_name TEXT NOT NULL,
    pressure_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    geometry GEOMETRY(MultiPolygon, 4326),
    estimated_impacted_area_ha NUMERIC(10,2),
    source_reference TEXT,
    verified_by TEXT,
    evidence_link_id UUID REFERENCES public.evidence_links(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_environmental_pressure_observations_area ON public.environmental_pressure_observations(coastal_area_name);
CREATE INDEX IF NOT EXISTS idx_environmental_pressure_observations_geom ON public.environmental_pressure_observations USING GIST (geometry);

ALTER TABLE public.socio_economic_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_pressure_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view socioeconomic observations" ON public.socio_economic_observations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert socioeconomic observations" ON public.socio_economic_observations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view environmental pressure observations" ON public.environmental_pressure_observations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert environmental pressure observations" ON public.environmental_pressure_observations FOR INSERT TO authenticated WITH CHECK (true);
