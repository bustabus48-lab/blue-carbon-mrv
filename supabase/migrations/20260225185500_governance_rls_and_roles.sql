-- 1. Enforce allowed roles on profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (
        role IN ('admin', 'crema_agent', 'gis_unit', 'soil_lab')
    );
-- 2. Drop the existing permissive policies on sar_change_alerts
DROP POLICY IF EXISTS "Allow read access to all users" ON public.sar_change_alerts;
-- 3. Create strict RLS policies for sar_change_alerts
-- Admins and GIS Unit View All
CREATE POLICY "Admins and GIS can view all alerts" ON public.sar_change_alerts FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin', 'gis_unit')
        )
    );
-- Agents View Assigned
CREATE POLICY "Agents can view assigned alerts" ON public.sar_change_alerts FOR
SELECT USING (
        assigned_to = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
-- Admins Update All
CREATE POLICY "Admins can update all alerts" ON public.sar_change_alerts FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
        )
    );
-- Agents Update Assigned
CREATE POLICY "Agents can update assigned alerts" ON public.sar_change_alerts FOR
UPDATE USING (
        assigned_to = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );