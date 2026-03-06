-- Migration: 20260305020000_create_projects_table.sql
-- Description: Creates the master projects table for multi-project support.
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    district VARCHAR(255),
    project_types TEXT [] NOT NULL DEFAULT '{restoration}',
    start_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT projects_status_check CHECK (status IN ('active', 'completed', 'paused'))
);
-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE
UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Enable RLS but allow all reads for MVP
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to all users" ON public.projects FOR
SELECT USING (true);
CREATE POLICY "Allow insert for all users" ON public.projects FOR
INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all users" ON public.projects FOR
UPDATE USING (true);
COMMENT ON TABLE public.projects IS 'Master table for Blue Carbon MRV projects. Each project represents a distinct restoration, conservation, or hydrology management effort.';