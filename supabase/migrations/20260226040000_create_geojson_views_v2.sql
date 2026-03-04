-- Migration: 20260226040000_create_geojson_views_v2.sql
-- Description: Creates GeoJSON views for leakage_zones and sample_plots for frontend map rendering.
-- Create a view for leakage_zones that converts PostGIS geometry to GeoJSON
CREATE OR REPLACE VIEW public.geojson_leakage_zones WITH (security_invoker = on) AS
SELECT id,
    zone_name,
    area_ha,
    ST_AsGeoJSON(geom)::json AS geojson
FROM public.leakage_zones;
-- Ensure the sample_plots view exists and uses consistent naming for the geometry column
-- (Recreating or ensuring it matches what's needed for MapProps)
DROP VIEW IF EXISTS public.geojson_sample_plots;
CREATE OR REPLACE VIEW public.geojson_sample_plots WITH (security_invoker = on) AS
SELECT id,
    plot_name,
    stratum,
    status,
    created_at,
    ST_AsGeoJSON(location)::json AS geojson
FROM public.sample_plots;