-- 1. Add assignment tracking to alerts
ALTER TABLE public.sar_change_alerts
ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
-- 2. Create the Alert Evidence table to store uploaded photos and notes
CREATE TABLE IF NOT EXISTS public.alert_evidence (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    alert_id UUID NOT NULL REFERENCES public.sar_change_alerts(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id),
    photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS on the new table
ALTER TABLE public.alert_evidence ENABLE ROW LEVEL SECURITY;
-- Allow public read access to evidence for the dashboard
CREATE POLICY "Public read access for alert evidence" ON public.alert_evidence FOR
SELECT USING (true);
-- Allow authenticated users to insert evidence
CREATE POLICY "Authenticated users can insert evidence" ON public.alert_evidence FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- 3. Configure the Supabase Storage Bucket for Field Photos
INSERT INTO storage.buckets (id, name, public)
VALUES (
        'alert_evidence_photos',
        'alert_evidence_photos',
        true
    ) ON CONFLICT (id) DO NOTHING;
-- Grant public read access to the photos bucket
CREATE POLICY "Public Access" ON storage.objects FOR
SELECT USING (bucket_id = 'alert_evidence_photos');
-- Grant authenticated users insert access to the photos bucket
CREATE POLICY "Authenticated Users Upload" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'alert_evidence_photos'
        AND auth.role() = 'authenticated'
    );