-- Migration: 20260305000000_relax_rls_mvp.sql
-- Description: Temporarily relax RLS on views and alerts to ensure the MVP demonstration can render data without strict profiles seeded.
-- Relax RLS on alerts
DROP POLICY IF EXISTS "Admins and GIS can view all alerts" ON public.sar_change_alerts;
DROP POLICY IF EXISTS "Agents can view assigned alerts" ON public.sar_change_alerts;
CREATE POLICY "Allow read access to all users for MVP" ON public.sar_change_alerts FOR
SELECT USING (true);
-- Relax RLS on project areas
DROP POLICY IF EXISTS "Admins and GIS can view all project areas" ON public.project_areas;
CREATE POLICY "Allow read access to all users for MVP" ON public.project_areas FOR
SELECT USING (true);