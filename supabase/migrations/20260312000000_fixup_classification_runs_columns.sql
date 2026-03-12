-- Fixup: add columns to classification_runs that were defined in the 20260304
-- migration but missed because the table was already created by 20260307.
ALTER TABLE public.classification_runs
    ADD COLUMN IF NOT EXISTS run_name TEXT,
    ADD COLUMN IF NOT EXISTS cadence_days INTEGER DEFAULT 7,
    ADD COLUMN IF NOT EXISTS source_platform TEXT DEFAULT 'Sentinel-1/2',
    ADD COLUMN IF NOT EXISTS model_name TEXT,
    ADD COLUMN IF NOT EXISTS model_version TEXT,
    ADD COLUMN IF NOT EXISTS area_of_interest TEXT,
    ADD COLUMN IF NOT EXISTS run_window_start DATE,
    ADD COLUMN IF NOT EXISTS run_window_end DATE,
    ADD COLUMN IF NOT EXISTS overall_accuracy NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS confusion_matrix JSONB,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_classification_runs_window ON public.classification_runs(run_window_end DESC);
CREATE INDEX IF NOT EXISTS idx_classification_runs_status ON public.classification_runs(status);
