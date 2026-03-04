-- Migration to create Safeguards & Social Integrity schemas (Module 8)
-- 1. Safeguard Documents Table (For storing FPIC, Benefit-Sharing Agreements, etc.)
CREATE TABLE IF NOT EXISTS public.safeguard_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(100) NOT NULL CHECK (
        document_type IN (
            'FPIC',
            'Benefit-Sharing Agreement',
            'Governance Composition',
            'Social Impact Assessment',
            'Other'
        )
    ),
    community_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(1024) NOT NULL,
    -- Path to Supabase Storage
    verification_status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (
        verification_status IN ('Pending', 'Verified', 'Rejected')
    ),
    uploaded_by VARCHAR(255) NOT NULL,
    -- Email of the uploader
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Turn on Row Level Security
ALTER TABLE public.safeguard_documents ENABLE ROW LEVEL SECURITY;
-- Admins can manage everything
CREATE POLICY "Admins can manage safeguard_documents" ON public.safeguard_documents FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);
-- Agents can view and upload documents, but cannot verify them (handled via UI logic or separate policy if needed, but for simplicity, we allow insert)
CREATE POLICY "Agents can view safeguard_documents" ON public.safeguard_documents FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
CREATE POLICY "Agents and Admins can insert safeguard_documents" ON public.safeguard_documents FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND (
                    profiles.role = 'crema_agent'
                    OR profiles.role = 'admin'
                )
        )
    );
-- 2. Grievances Table (Ticketing system for community complaints)
CREATE TABLE IF NOT EXISTS public.grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_reported DATE NOT NULL DEFAULT CURRENT_DATE,
    community_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (
        category IN (
            'Land Dispute',
            'Benefit-Sharing',
            'Employment',
            'Access Restriction',
            'Other'
        )
    ),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (
        status IN (
            'Open',
            'Under Investigation',
            'Resolved',
            'Dismissed'
        )
    ),
    resolution_notes TEXT,
    reported_by_phone VARCHAR(50),
    logged_by VARCHAR(255) NOT NULL,
    -- Email of the uploader
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Turn on Row Level Security
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
-- Admins can manage everything
CREATE POLICY "Admins can manage grievances" ON public.grievances FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
    )
);
-- Agents can view and insert grievances
CREATE POLICY "Agents can view grievances" ON public.grievances FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND profiles.role = 'crema_agent'
        )
    );
CREATE POLICY "Agents and Admins can insert grievances" ON public.grievances FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
                AND (
                    profiles.role = 'crema_agent'
                    OR profiles.role = 'admin'
                )
        )
    );
-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_safeguards_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_safeguard_documents_updated_at BEFORE
UPDATE ON public.safeguard_documents FOR EACH ROW EXECUTE FUNCTION update_safeguards_updated_at_column();
CREATE TRIGGER update_grievances_updated_at BEFORE
UPDATE ON public.grievances FOR EACH ROW EXECUTE FUNCTION update_safeguards_updated_at_column();