-- Migration to create Traceability & Compliance Engine schema (Module 9)
-- 1. Monitoring Cycles Table (For defining audit periods)
CREATE TABLE IF NOT EXISTS public.monitoring_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Planning' CHECK (
        status IN (
            'Planning',
            'Active',
            'Under Review',
            'Verified',
            'Closed'
        )
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Turn on Row Level Security
ALTER TABLE public.monitoring_cycles ENABLE ROW LEVEL SECURITY;
-- Admins can manage everything
CREATE POLICY "Admins can manage monitoring_cycles" ON public.monitoring_cycles FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);
-- Agents and generic authenticated users can view monitoring cycles
CREATE POLICY "Agents can view monitoring_cycles" ON public.monitoring_cycles FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
        )
    );
-- 2. Compliance Checklists Table (For tracking specific requirements per cycle)
CREATE TABLE IF NOT EXISTS public.compliance_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID NOT NULL REFERENCES public.monitoring_cycles(id) ON DELETE CASCADE,
    requirement_type VARCHAR(100) NOT NULL CHECK (
        requirement_type IN (
            'Biomass Survey',
            'Soil Sampling',
            'FPIC Signed',
            'Leakage Monitored',
            'Other'
        )
    ),
    is_met BOOLEAN DEFAULT false,
    verified_by VARCHAR(255),
    -- Email of the person who verified
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Turn on Row Level Security
ALTER TABLE public.compliance_checklists ENABLE ROW LEVEL SECURITY;
-- Admins can manage everything
CREATE POLICY "Admins can manage compliance_checklists" ON public.compliance_checklists FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);
-- Agents can view checklists
CREATE POLICY "Agents can view compliance_checklists" ON public.compliance_checklists FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
        )
    );
-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_compliance_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_monitoring_cycles_updated_at BEFORE
UPDATE ON public.monitoring_cycles FOR EACH ROW EXECUTE FUNCTION update_compliance_updated_at_column();
CREATE TRIGGER update_compliance_checklists_updated_at BEFORE
UPDATE ON public.compliance_checklists FOR EACH ROW EXECUTE FUNCTION update_compliance_updated_at_column();