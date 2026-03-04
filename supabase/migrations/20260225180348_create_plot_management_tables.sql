-- Migration: 20260225180348_create_plot_management_tables.sql
-- Description: Creates sample_plots and plot_measurements for Module 2 field data collection.
-- Ensure PostGIS is enabled (should be, but safe to verify)
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;
-- 1. Create the Permanent Sample Plots table
CREATE TABLE IF NOT EXISTS public.sample_plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_name TEXT NOT NULL,
    stratum TEXT NOT NULL CHECK (
        stratum IN (
            'Fringing',
            'Basin',
            'Riverine',
            'Overwash',
            'Scrub',
            'Hammock'
        )
    ),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (
        status IN ('Active', 'Restoring', 'Degraded', 'Inactive')
    ),
    location GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Index for spatial queries on plots
CREATE INDEX idx_sample_plots_location ON public.sample_plots USING GIST (location);
-- 2. Create the Plot Measurements table for longitudinal tracking
CREATE TABLE IF NOT EXISTS public.plot_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID NOT NULL REFERENCES public.sample_plots(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        canopy_cover_percent NUMERIC CHECK (
            canopy_cover_percent >= 0
            AND canopy_cover_percent <= 100
        ),
        avg_tree_height_m NUMERIC CHECK (avg_tree_height_m >= 0),
        above_ground_biomass_tc_ha NUMERIC CHECK (above_ground_biomass_tc_ha >= 0),
        notes TEXT,
        is_qa_survey BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Index on plot_id for fast lookups of measurement history
CREATE INDEX idx_plot_measurements_plot_id ON public.plot_measurements(plot_id);
-- Enable RLS
ALTER TABLE public.sample_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_measurements ENABLE ROW LEVEL SECURITY;
-- Create Policies for sample_plots
-- Allow read access to authenticated users
CREATE POLICY "Allow authenticated users to view sample plots" ON public.sample_plots FOR
SELECT TO authenticated USING (true);
-- Allow admins/officers to insert/update (Assuming authenticated for now)
CREATE POLICY "Allow authenticated users to insert sample plots" ON public.sample_plots FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update sample plots" ON public.sample_plots FOR
UPDATE TO authenticated USING (true);
-- Create Policies for plot_measurements
CREATE POLICY "Allow authenticated users to view measurements" ON public.plot_measurements FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert measurements" ON public.plot_measurements FOR
INSERT TO authenticated WITH CHECK (true);
-- Create a GeoJSON View for sample_plots to easily render them on maps
CREATE OR REPLACE VIEW public.geojson_sample_plots AS
SELECT id,
    plot_name,
    stratum,
    status,
    created_at,
    ST_AsGeoJSON(location)::json AS geometry
FROM public.sample_plots;