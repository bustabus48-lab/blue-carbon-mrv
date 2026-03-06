-- Migration: 20260305030000_wire_all_tables_to_projects.sql
-- Description: Adds project_id FK to all remaining tables for full project-centric architecture.
-- 1. Safeguards module
ALTER TABLE public.safeguard_documents
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_safeguard_documents_project_id ON public.safeguard_documents(project_id);
ALTER TABLE public.grievances
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_grievances_project_id ON public.grievances(project_id);
-- 2. Compliance module
ALTER TABLE public.monitoring_cycles
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_monitoring_cycles_project_id ON public.monitoring_cycles(project_id);
-- compliance_checklists already chains through monitoring_cycles, but add direct FK for easier filtering
ALTER TABLE public.compliance_checklists
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_compliance_checklists_project_id ON public.compliance_checklists(project_id);
-- 3. Carbon Accounting module
-- carbon_calculations already chains through sample_plots.project_id, add direct FK
ALTER TABLE public.carbon_calculations
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_carbon_calculations_project_id ON public.carbon_calculations(project_id);
-- 4. Soil Lab module
-- soil_samples already chains through sample_plots.project_id, add direct FK
ALTER TABLE public.soil_samples
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_soil_samples_project_id ON public.soil_samples(project_id);
-- 5. Leakage & Permanence module
ALTER TABLE public.market_surveys
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_market_surveys_project_id ON public.market_surveys(project_id);
ALTER TABLE public.reversal_events
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_reversal_events_project_id ON public.reversal_events(project_id);
ALTER TABLE public.risk_scoring
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_risk_scoring_project_id ON public.risk_scoring(project_id);
-- 6. RLS policies — allow all reads for MVP
CREATE POLICY "Allow read for all - safeguard_documents" ON public.safeguard_documents FOR
SELECT USING (true);
CREATE POLICY "Allow insert for all - safeguard_documents" ON public.safeguard_documents FOR
INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all - grievances" ON public.grievances FOR
SELECT USING (true);
CREATE POLICY "Allow insert for all - grievances" ON public.grievances FOR
INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all - monitoring_cycles" ON public.monitoring_cycles FOR
SELECT USING (true);
CREATE POLICY "Allow insert for all - monitoring_cycles" ON public.monitoring_cycles FOR
INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all - compliance_checklists" ON public.compliance_checklists FOR
SELECT USING (true);
CREATE POLICY "Allow insert for all - compliance_checklists" ON public.compliance_checklists FOR
INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all - carbon_calculations" ON public.carbon_calculations FOR
SELECT USING (true);
CREATE POLICY "Allow read for all - soil_samples" ON public.soil_samples FOR
SELECT USING (true);
CREATE POLICY "Allow insert for all - soil_samples" ON public.soil_samples FOR
INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all - market_surveys" ON public.market_surveys FOR
SELECT USING (true);
CREATE POLICY "Allow read for all - reversal_events" ON public.reversal_events FOR
SELECT USING (true);
CREATE POLICY "Allow read for all - risk_scoring" ON public.risk_scoring FOR
SELECT USING (true);