-- Migration: 20260304110000_create_project_areas_schema.sql
-- Description: Adds canonical project area polygons for restoration/conservation/protection/buffer/reference mapping.

CREATE TABLE IF NOT EXISTS public.project_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_name TEXT NOT NULL,
    area_type TEXT NOT NULL CHECK (
        area_type IN ('restoration', 'conservation', 'protection', 'buffer', 'reference')
    ),
    source_file_name TEXT,
    area_ha NUMERIC(12, 2),
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    geom GEOMETRY(MultiPolygon, 4326) NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_areas_geom ON public.project_areas USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_project_areas_area_type ON public.project_areas(area_type);

ALTER TABLE public.project_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view project areas"
ON public.project_areas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert project areas"
ON public.project_areas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update project areas"
ON public.project_areas FOR UPDATE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION update_project_areas_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_project_areas_updated_at ON public.project_areas;
CREATE TRIGGER update_project_areas_updated_at
BEFORE UPDATE ON public.project_areas
FOR EACH ROW
EXECUTE FUNCTION update_project_areas_updated_at_column();

CREATE OR REPLACE VIEW public.geojson_project_areas WITH (security_invoker = on) AS
SELECT
    id,
    area_name,
    area_type,
    source_file_name,
    area_ha,
    properties,
    created_at,
    updated_at,
    ST_AsGeoJSON(geom)::jsonb AS geojson
FROM public.project_areas;
