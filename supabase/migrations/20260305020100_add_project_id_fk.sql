-- Migration: 20260305020100_add_project_id_fk.sql
-- Description: Adds project_id foreign key to all spatial tables and expands area_type options.
-- 1. Add project_id FK to project_areas
ALTER TABLE public.project_areas
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
-- 2. Add project_id FK to mangrove_plots
ALTER TABLE public.mangrove_plots
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
-- 3. Add project_id FK to sar_change_alerts
ALTER TABLE public.sar_change_alerts
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
-- 4. Add project_id FK to leakage_zones
ALTER TABLE public.leakage_zones
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
-- 5. Add project_id FK to sample_plots
ALTER TABLE public.sample_plots
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
-- 6. Update the area_type check constraint on project_areas to include new types
ALTER TABLE public.project_areas DROP CONSTRAINT IF EXISTS project_areas_area_type_check;
ALTER TABLE public.project_areas
ADD CONSTRAINT project_areas_area_type_check CHECK (
        area_type IN (
            'restoration',
            'conservation',
            'protection',
            'buffer',
            'reference',
            'hydrology',
            'mangrove_extent',
            'project_boundary'
        )
    );
-- 7. Update geojson views to include project_id
DROP VIEW IF EXISTS public.geojson_alerts;
CREATE OR REPLACE VIEW public.geojson_alerts WITH (security_invoker = on) AS
SELECT id,
    alert_type,
    severity,
    confidence_score,
    status,
    detected_area_ha,
    event_date,
    project_id,
    ST_AsGeoJSON(geom)::jsonb AS geojson
FROM public.sar_change_alerts;
DROP VIEW IF EXISTS public.geojson_project_areas;
CREATE OR REPLACE VIEW public.geojson_project_areas WITH (security_invoker = on) AS
SELECT id,
    area_name,
    area_type,
    area_ha,
    properties,
    project_id,
    ST_AsGeoJSON(geom)::jsonb AS geojson
FROM public.project_areas;
DROP VIEW IF EXISTS public.geojson_plots;
CREATE OR REPLACE VIEW public.geojson_plots WITH (security_invoker = on) AS
SELECT id,
    stratum_name,
    area_ha,
    planting_date,
    project_id,
    created_at,
    updated_at,
    ST_AsGeoJSON(geom)::jsonb AS geojson
FROM public.mangrove_plots;
DROP VIEW IF EXISTS public.geojson_leakage_zones;
CREATE OR REPLACE VIEW public.geojson_leakage_zones WITH (security_invoker = on) AS
SELECT id,
    zone_name,
    area_ha,
    project_id,
    ST_AsGeoJSON(geom)::jsonb AS geojson
FROM public.leakage_zones;
DROP VIEW IF EXISTS public.geojson_sample_plots;
CREATE OR REPLACE VIEW public.geojson_sample_plots WITH (security_invoker = on) AS
SELECT id,
    plot_name,
    stratum,
    status,
    project_id,
    created_at,
    ST_AsGeoJSON(location)::jsonb AS geojson
FROM public.sample_plots;
-- 8. Create indexes for project_id lookups
CREATE INDEX IF NOT EXISTS idx_project_areas_project_id ON public.project_areas(project_id);
CREATE INDEX IF NOT EXISTS idx_mangrove_plots_project_id ON public.mangrove_plots(project_id);
CREATE INDEX IF NOT EXISTS idx_sar_change_alerts_project_id ON public.sar_change_alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_leakage_zones_project_id ON public.leakage_zones(project_id);
CREATE INDEX IF NOT EXISTS idx_sample_plots_project_id ON public.sample_plots(project_id);