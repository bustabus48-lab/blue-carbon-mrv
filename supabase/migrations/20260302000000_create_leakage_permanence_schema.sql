-- Migration to create the Leakage and Permanence Monitoring schemas (Module 7)
-- 1. Market Surveys Table (For predicting and documenting Leakage/Emissions Displacement)
CREATE TABLE IF NOT EXISTS public.market_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_date DATE NOT NULL DEFAULT CURRENT_DATE,
    surveyed_by VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    fuelwood_price_ghs NUMERIC(10, 2) NOT NULL,
    charcoal_price_ghs NUMERIC(10, 2) NOT NULL,
    estimated_displacement_volume NUMERIC(10, 2),
    -- Estimated amount of timber/wood extracted
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Turn on Row Level Security
ALTER TABLE public.market_surveys ENABLE ROW LEVEL SECURITY;
-- Admins can manage everything
CREATE POLICY "Admins can manage market_surveys" ON public.market_surveys FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);
-- Agents can only view or insert their own surveys
CREATE POLICY "Agents can view and insert own surveys" ON public.market_surveys FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
CREATE POLICY "Agents can insert own surveys" ON public.market_surveys FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
-- 2. Reversal Events Table (For tracking physical losses against the Buffer Pool)
CREATE TABLE IF NOT EXISTS public.reversal_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID REFERENCES public.sample_plots(id) ON DELETE CASCADE,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    event_type VARCHAR(50) NOT NULL CHECK (
        event_type IN (
            'Storm',
            'Illegal Logging',
            'Fire',
            'Disease',
            'Erosion',
            'Other'
        )
    ),
    estimated_tco2e_lost NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'Investigating' CHECK (
        status IN (
            'Investigating',
            'Buffer Deducted',
            'Resolved',
            'False Alarm'
        )
    ),
    notes TEXT,
    reported_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Turn on Row Level Security
ALTER TABLE public.reversal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage reversal_events" ON public.reversal_events FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);
CREATE POLICY "Agents can read reversal_events" ON public.reversal_events FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
-- 3. Risk Scoring Table (Calculates the total % required for the Buffer Pool)
CREATE TABLE IF NOT EXISTS public.risk_scoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    internal_risk_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    external_risk_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    natural_risk_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total_buffer_percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
        internal_risk_score + external_risk_score + natural_risk_score
    ) STORED,
    assessor VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Turn on Row Level Security
ALTER TABLE public.risk_scoring ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage risk_scoring" ON public.risk_scoring FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);
-- Agents cannot read risk scoring details directly, only admins.
-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_leakage_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_market_surveys_updated_at BEFORE
UPDATE ON public.market_surveys FOR EACH ROW EXECUTE FUNCTION update_leakage_updated_at_column();
CREATE TRIGGER update_reversal_events_updated_at BEFORE
UPDATE ON public.reversal_events FOR EACH ROW EXECUTE FUNCTION update_leakage_updated_at_column();
CREATE TRIGGER update_risk_scoring_updated_at BEFORE
UPDATE ON public.risk_scoring FOR EACH ROW EXECUTE FUNCTION update_leakage_updated_at_column();