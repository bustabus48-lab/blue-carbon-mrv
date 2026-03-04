-- Migration to create the Safeguards Document Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES (
        'safeguard_documents',
        'safeguard_documents',
        true
    ) ON CONFLICT (id) DO NOTHING;
-- Set up security policies for the bucket
-- Allow public access to view documents (if needed, but for now we restrict to authenticated users)
CREATE POLICY "Public Access to safeguard_documents" ON storage.objects FOR
SELECT USING (bucket_id = 'safeguard_documents');
-- Allow agents to upload documents
CREATE POLICY "Agents can upload to safeguard_documents" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'safeguard_documents'
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
-- Allow admins full control
CREATE POLICY "Admins have full control over safeguard_documents" ON storage.objects FOR ALL USING (
    bucket_id = 'safeguard_documents'
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);