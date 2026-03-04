-- Migration to create the carbon accounting engine tables for Module 4
-- 1. Create emission_factors table
-- This stores the scientific constants needed for AGB and BGB calculations per stratum
CREATE TABLE IF NOT EXISTS public.emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stratum VARCHAR(50) UNIQUE NOT NULL,
    -- e.g., 'Fringing', 'Basin', 'Riverine', 'Default'
    carbon_fraction NUMERIC NOT NULL DEFAULT 0.47,
    -- IPCC default for mangrove wood
    root_shoot_ratio NUMERIC NOT NULL DEFAULT 0.25,
    -- To estimate BGB from AGB
    co2_conversion_factor NUMERIC NOT NULL DEFAULT 3.67,
    -- Ratio of molecular weight of CO2 to C
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Turn on Row Level Security
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;
-- Emission factors are strictly managed by Admins, but readable by Agents
CREATE POLICY "Admins can manage emission_factors" ON public.emission_factors FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);
CREATE POLICY "Agents can read emission_factors" ON public.emission_factors FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
-- 2. Create carbon_calculations table
-- This stores the periodic outputs of the carbon engine for each plot
CREATE TABLE IF NOT EXISTS public.carbon_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID REFERENCES public.sample_plots(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Raw inputs utilized for this run
    measured_agb_tc_ha NUMERIC NOT NULL,
    -- Latest Above Ground Biomass metric
    measured_soil_c_density NUMERIC NOT NULL,
    -- Latest Soil Carbon Density metric
    -- Engine Outputs (Carbon)
    total_above_ground_c_t NUMERIC NOT NULL,
    total_below_ground_c_t NUMERIC NOT NULL,
    total_soil_c_t NUMERIC NOT NULL,
    total_ecosystem_c_t NUMERIC NOT NULL,
    -- AGB + BGB + Soil
    -- Engine Outputs (Credits/tCO2e)
    gross_tco2e NUMERIC NOT NULL,
    -- total_ecosystem_c_t * 3.67
    leakage_deduction_t NUMERIC NOT NULL DEFAULT 0,
    -- Standard 10% deduction area
    buffer_deduction_t NUMERIC NOT NULL DEFAULT 0,
    -- Standard 15% non-permanence buffer
    net_issuable_tco2e NUMERIC NOT NULL,
    -- Gross - Leakage - Buffer
    calculated_by VARCHAR(255) NOT NULL,
    -- Email/ID of the user who triggered the run
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Turn on Row Level Security
ALTER TABLE public.carbon_calculations ENABLE ROW LEVEL SECURITY;
-- Admins act as auditors and can do everything
CREATE POLICY "Admins can access carbon_calculations" ON public.carbon_calculations FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);
-- Agents can only view the calculations for transparency
CREATE POLICY "Agents can read carbon_calculations" ON public.carbon_calculations FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_carbon_acc_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_emission_factors_updated_at BEFORE
UPDATE ON public.emission_factors FOR EACH ROW EXECUTE FUNCTION update_carbon_acc_updated_at_column();
CREATE TRIGGER update_carbon_calculations_updated_at BEFORE
UPDATE ON public.carbon_calculations FOR EACH ROW EXECUTE FUNCTION update_carbon_acc_updated_at_column();
-- Seed Default Emission Factors
INSERT INTO public.emission_factors (stratum, carbon_fraction, root_shoot_ratio)
VALUES ('Default', 0.47, 0.25),
    ('Fringing', 0.48, 0.28),
    -- Fringing mangroves often have denser root wads
    ('Basin', 0.46, 0.22),
    ('Riverine', 0.49, 0.30);