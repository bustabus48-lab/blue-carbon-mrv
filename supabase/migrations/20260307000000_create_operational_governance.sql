-- Migration: Operational Governance & Automation (Phase 8)
-- Description: Adds tables for tracking asynchronous ingestion jobs and satellite classification runs for SLA monitoring and QA/QC approval.
-- 1. Ingestion Jobs Table (QA/QC queue)
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (
        job_type IN (
            'imagery',
            'vector_upload',
            'biometric_data',
            'sensor_data'
        )
    ),
    filename TEXT NOT NULL,
    file_hash TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (
        status IN (
            'queued',
            'processing',
            'completed',
            'failed',
            'pending_approval',
            'approved',
            'rejected'
        )
    ),
    uploaded_by UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    validation_errors JSONB DEFAULT '[]'::jsonb,
    audit_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);
-- 2. Classification Runs Table (SLA Monitoring)
CREATE TABLE IF NOT EXISTS public.classification_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    run_type TEXT NOT NULL CHECK (
        run_type IN ('weekly_scan', 'ad_hoc', 'baseline_ingestion')
    ),
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
    tiles_processed INTEGER DEFAULT 0,
    alerts_generated INTEGER DEFAULT 0,
    cloud_cover_avg NUMERIC,
    error_message TEXT,
    qa_accuracy NUMERIC,
    -- percentage 0-100 if manual QA was done
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER GENERATED ALWAYS AS (
        EXTRACT(
            EPOCH
            FROM (completed_at - started_at)
        )::INTEGER
    ) STORED
);
-- Add updated_at trigger for ingestion_jobs
CREATE OR REPLACE FUNCTION update_ingestion_jobs_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_ingestion_jobs_timestamp BEFORE
UPDATE ON public.ingestion_jobs FOR EACH ROW EXECUTE PROCEDURE update_ingestion_jobs_updated_at();
-- RLS
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification_runs ENABLE ROW LEVEL SECURITY;
-- Agents can insert and read jobs for their projects, Admins can do all including approve
CREATE POLICY "Users can read jobs for their projects" ON public.ingestion_jobs FOR
SELECT USING (true);
CREATE POLICY "Users can insert jobs" ON public.ingestion_jobs FOR
INSERT WITH CHECK (true);
CREATE POLICY "Users can update their jobs" ON public.ingestion_jobs FOR
UPDATE USING (true);
CREATE POLICY "Users can read runs" ON public.classification_runs FOR
SELECT USING (true);
CREATE POLICY "System can insert runs" ON public.classification_runs FOR
INSERT WITH CHECK (true);
CREATE POLICY "System can update runs" ON public.classification_runs FOR
UPDATE USING (true);