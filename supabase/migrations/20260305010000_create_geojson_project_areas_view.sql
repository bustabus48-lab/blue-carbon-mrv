-- Migration: 20260305010000_create_geojson_project_areas_view.sql
-- Description: Creates GeoJSON view for project_areas table for frontend map rendering.
DROP VIEW IF EXISTS public.geojson_project_areas;
CREATE OR REPLACE VIEW public.geojson_project_areas WITH (security_invoker = on) AS
SELECT id,
    area_name,
    area_type,
    area_ha,
    properties,
    ST_AsGeoJSON(geom)::jsonb AS geojson
FROM public.project_areas;