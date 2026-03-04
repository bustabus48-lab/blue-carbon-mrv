# Project Review: Ghana Blue Carbon MRV Platform

## Executive Summary

This repository has a **strong MVP foundation** for a national Blue Carbon MRV platform, but it currently meets the stated goals only **partially**.

- ✅ Clear stack choice and architecture (Next.js + FastAPI + PostGIS).
- ✅ Core geospatial entities exist for mangrove plots, leakage zones, alerts, and sample plots.
- ✅ Dashboard modules exist for safeguards, compliance, leakage/permanence, soil, alerts, and map visualization.
- ⚠️ Several critical workflows are still placeholders or incomplete (e.g., upload ingestion persistence, automated 7‑day classified imagery pipeline, and robust baseline onboarding for any coastal area in Ghana).

Overall readiness assessment:

- **Current state:** MVP / prototype
- **Production readiness for national MRV audits:** Not yet
- **Recommended trajectory:** move from UI-first MVP to workflow-complete, evidence-traceable MRV operations platform

---

## Goal-by-Goal Assessment

### 1) Ingest baseline information from any coastal area in Ghana

**Status: Partially met**

What exists:
- Database and UI modules can hold multiple kinds of data (plots, sample plots, safeguards, compliance).
- There are scripts for ingesting mangrove extents and baseline documents.

Gaps:
- Ingestion scripts are environment-specific and rely on hard-coded local absolute file paths, so they are not reusable for arbitrary coastal areas without editing code.
- Upload API currently parses GeoJSON and returns preview data, but does not persist features into core spatial tables with validation and provenance metadata.

### 2) UI for easy understanding of data

**Status: Mostly met (for MVP scope)**

What exists:
- A dashboard with KPIs and map-based layer visualization.
- Dedicated modules for alerts, safeguards, leakage/permanence, compliance, plots, and soil.

Gaps:
- Some views use static placeholder metrics/tables and do not yet reflect auditable live summaries across all modules.
- Cross-module drill-down (evidence linking from map -> alert -> verification -> compliance artifact) remains limited.

### 3) Save polygons for restoration, conservation/protection, and permanent sample plots

**Status: Partially met**

What exists:
- `mangrove_plots` polygons, `leakage_zones` polygons, and `sample_plots` points are modeled and displayed on maps.

Gaps:
- Restoration vs conservation/protection polygons are not separated as first-class typed project areas.
- Permanent sample plots are currently point geometry only; if polygon-based PSP boundaries are required, schema and UI do not yet support that.
- Polygon upload flow is MVP-only (validation + preview) and not a full persisted ingestion pipeline.

### 4) Map interface for buffer zones and all uploaded/saved polygons

**Status: Mostly met for current datasets**

What exists:
- Map layer rendering supports plots, leakage zones (buffer-style visualization), alerts, and sample plots.

Gaps:
- No generalized map layer registry for “all uploaded polygons.”
- Layer visibility/filter controls are minimal; no robust style/version metadata for uploaded layer management.

### 5) Keep social, economic, safeguards, FPIC, environmental pressures, restoration data for audits

**Status: Partially met**

What exists:
- Safeguards module includes document repository and grievance workflows.
- Compliance module and monitoring cycles/checklists tables support audit workflows.

Gaps:
- Economic and environmental pressure indicators are not modeled as rich, structured, time-series entities.
- Traceability is incomplete: many records lack immutable evidence linkage, chain-of-custody, and full audit event history.
- “Restoration data” exists in parts (plots, statuses, alerts) but needs explicit restoration activity logs and outcomes.

### 6) Take uploads and store them in database for present/future use

**Status: Partially met**

What exists:
- Document uploads are stored in Supabase Storage with metadata persisted in DB.

Gaps:
- Spatial upload endpoint currently validates/parses but does not persist uploaded features to canonical tables.
- No ingestion job tracking table (who uploaded what, schema validation result, accepted/rejected features, timestamps, checksums).

### 7) Every 7 days provide newly classified change image maps

**Status: Not met yet (as an automated operational workflow)**

What exists:
- Alert tables and map displays can show change alerts.

Gaps:
- No visible scheduler/orchestrator for 7-day cadence.
- No end-to-end classification pipeline in repo (imagery acquisition -> preprocessing -> model/classification -> QA -> publication).
- No data model for classification runs, model versions, confusion matrices, or raster asset catalog tied to map viewer.

---

## Priority Recommendations

## P0 (Critical: required for MRV audit credibility)

1. **Implement a production-grade spatial ingestion pipeline**
   - Convert upload-preview endpoint into staged ingestion:
     - upload -> schema validation -> geometry validation -> CRS normalization -> deduplication -> manual approval -> publish.
   - Persist ingestion metadata (source file hash, uploader, upload date, area of interest, parser version).

2. **Add immutable audit and evidence traceability across modules**
   - Introduce append-only audit log for CRUD and status transitions.
   - Add explicit evidence linking table (`entity_type`, `entity_id`, `document_id`, `relation_type`, `created_by`).

3. **Operationalize 7-day remote sensing pipeline**
   - Add scheduled workflow (cron / cloud scheduler) with run tracking.
   - Store outputs: classification raster, change polygons, confidence scores, run metadata, QA metrics.
   - Surface run status in UI (latest run, success/failure, coverage, lag days).

## P1 (High value: expand functional completeness)

4. **Model project-area polygon types explicitly**
   - Add a canonical `project_areas` table with `area_type` enum:
     - `restoration`, `conservation`, `protection`, `buffer`, `reference`.
   - Keep geometry history/versioning to prevent destructive overwrites.

5. **Generalize Ghana-wide baseline onboarding**
   - Replace hard-coded paths in scripts with CLI arguments and config files.
   - Support district/coastal-zone metadata and standardized baseline templates.

6. **Strengthen structured social/economic/environmental data capture**
   - Add normalized tables for socioeconomic indicators, environmental pressures, safeguard KPIs, and periodic observations.
   - Include monitoring period + data source + verifier fields for audit readiness.

## P2 (Optimization and scale)

7. **Improve geospatial UX**
   - Layer catalog, legend, filtering by date/type/status, geometry search, and feature-level history.

8. **Data quality and governance controls**
   - Add uniqueness constraints, topology checks, and QA/QC flags.
   - Build data quality dashboards (missing fields, invalid geometries, stale records).

9. **Security hardening and role policies**
   - Align RLS policies strictly with functional roles (admin, GIS, safeguards, auditor, etc.).
   - Add 2FA and immutable audit export endpoints for auditors.

---

## Suggested 90-Day Implementation Roadmap

### Weeks 1–3
- Build ingestion job framework and persist spatial uploads.
- Add standardized geometry validation and CRS conversion.
- Add ingestion review UI + publish action.

### Weeks 4–6
- Introduce project area type model and geometry versioning.
- Implement evidence-linking and audit log schema.
- Wire cross-module traceability links in UI.

### Weeks 7–9
- Implement first operational 7-day classification pipeline (even if rule-based MVP).
- Add run metadata tables and map publication workflow.

### Weeks 10–12
- Expand socioeconomic/environmental pressure structured forms + reporting.
- Add governance/QA dashboards and auditor export bundle.

---

## Final Verdict

The project is a **promising and well-scaffolded MVP** with strong alignment to the intended MRV architecture, especially on geospatial display and module structure. To fully meet Ghana’s MRV goals, the next phase should prioritize **workflow completeness, audit traceability, and automated remote-sensing operations** rather than adding more UI screens alone.
