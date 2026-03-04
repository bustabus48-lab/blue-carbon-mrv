-- Migration to create the soil_samples table for Module 3: Soil & Laboratory Management
-- Create soil_samples table
CREATE TABLE IF NOT EXISTS public.soil_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID REFERENCES public.sample_plots(id) ON DELETE CASCADE,
    sample_id VARCHAR(50) UNIQUE NOT NULL,
    -- e.g., 'KETA-S-001'
    -- Chain of Custody
    collected_date DATE NOT NULL,
    collected_by VARCHAR(255) NOT NULL,
    -- Field collector name/ID
    received_date DATE,
    received_by VARCHAR(255),
    -- Lab tech name/ID
    analysis_date DATE,
    -- Laboratory Metrics
    depth_interval VARCHAR(50) NOT NULL,
    -- e.g., '0-15cm', '15-30cm'
    core_volume_cm3 NUMERIC,
    dry_weight_g NUMERIC,
    organic_carbon_percent NUMERIC,
    -- Calculated Metrics (can be updated via UI or triggers)
    bulk_density_g_cm3 NUMERIC,
    soil_carbon_density NUMERIC,
    analysis_status VARCHAR(50) DEFAULT 'Pending',
    -- 'Pending', 'In Progress', 'Analysed', 'Flagged'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Turn on Row Level Security
ALTER TABLE public.soil_samples ENABLE ROW LEVEL SECURITY;
-- Creating policies
-- Admins can do everything
CREATE POLICY "Admins can access all soil_samples" ON public.soil_samples FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);
-- Agents can read all soil samples, but only insert/update their own submissions
CREATE POLICY "Agents can read all soil_samples" ON public.soil_samples FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
CREATE POLICY "Agents can insert soil_samples" ON public.soil_samples FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
CREATE POLICY "Agents can update soil_samples" ON public.soil_samples FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_soil_samples_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_soil_samples_updated_at BEFORE
UPDATE ON public.soil_samples FOR EACH ROW EXECUTE FUNCTION update_soil_samples_updated_at_column();