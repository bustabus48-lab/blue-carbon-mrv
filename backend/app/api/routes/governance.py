from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.db.database import get_db
from app.models.governance import IngestionJob, ClassificationRun
import uuid

router = APIRouter()

@router.get("/ingestion-jobs")
async def get_ingestion_jobs(
    project_id: str = Query(None, description="Filter jobs by specific project"),
    status: str = Query(None, description="Filter jobs by status"),
    limit: int = Query(50),
    db: AsyncSession = Depends(get_db)
):
    query = select(IngestionJob)
    
    if project_id and project_id != "all":
        try:
            proj_uuid = uuid.UUID(project_id)
            query = query.where(IngestionJob.project_id == proj_uuid)
        except ValueError:
            pass
            
    if status:
        query = query.where(IngestionJob.status == status)

    query = query.order_by(desc(IngestionJob.created_at)).limit(limit)
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    return [
        {
            "id": str(job.id),
            "project_id": str(job.project_id) if job.project_id else None,
            "job_type": job.job_type,
            "filename": job.filename,
            "file_hash": job.file_hash,
            "status": job.status,
            "uploaded_by": str(job.uploaded_by) if job.uploaded_by else None,
            "reviewed_by": str(job.reviewed_by) if job.reviewed_by else None,
            "validation_errors": job.validation_errors,
            "audit_log": job.audit_log,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "updated_at": job.updated_at.isoformat() if job.updated_at else None,
        }
        for job in jobs
    ]

@router.put("/ingestion-jobs/{job_id}/status")
async def update_ingestion_job_status(
    job_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db)
):
    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")

    result = await db.execute(select(IngestionJob).where(IngestionJob.id == job_id))
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = new_status
    # If the payload includes validation errors, we can update them here
    if "validation_errors" in payload:
        job.validation_errors = payload["validation_errors"]
        
    await db.commit()
    await db.refresh(job)
    return {"status": "success", "job_id": str(job.id), "new_status": job.status}

@router.get("/classification-runs")
async def get_classification_runs(
    project_id: str = Query(None, description="Filter runs by specific project"),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db)
):
    query = select(ClassificationRun)
    
    if project_id and project_id != "all":
        try:
            proj_uuid = uuid.UUID(project_id)
            query = query.where(ClassificationRun.project_id == proj_uuid)
        except ValueError:
            pass
            
    query = query.order_by(desc(ClassificationRun.started_at)).limit(limit)
    result = await db.execute(query)
    runs = result.scalars().all()
    
    return [
        {
            "id": str(run.id),
            "project_id": str(run.project_id) if run.project_id else None,
            "run_type": run.run_type,
            "status": run.status,
            "tiles_processed": run.tiles_processed,
            "alerts_generated": run.alerts_generated,
            "cloud_cover_avg": float(run.cloud_cover_avg) if run.cloud_cover_avg else None,
            "error_message": run.error_message,
            "started_at": run.started_at.isoformat() if run.started_at else None,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            "duration_seconds": run.duration_seconds,
        }
        for run in runs
    ]
