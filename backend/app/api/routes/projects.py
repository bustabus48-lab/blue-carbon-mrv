from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
import datetime
import uuid

from app.db.database import get_db
from app.models.polygon import Project

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str
    region: Optional[str] = None
    district: Optional[str] = None
    project_types: List[str] = ["restoration"]
    start_date: Optional[str] = None
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    district: Optional[str] = None
    project_types: Optional[List[str]] = None
    start_date: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


@router.get("/")
async def list_projects(db: AsyncSession = Depends(get_db)):
    """List all projects with summary statistics."""
    result = await db.execute(
        select(Project).order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "region": p.region,
            "district": p.district,
            "project_types": p.project_types,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "status": p.status,
            "description": p.description,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in projects
    ]


@router.get("/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single project by ID."""
    result = await db.execute(
        select(Project).where(Project.id == uuid.UUID(project_id))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {
        "id": str(project.id),
        "name": project.name,
        "region": project.region,
        "district": project.district,
        "project_types": project.project_types,
        "start_date": project.start_date.isoformat() if project.start_date else None,
        "status": project.status,
        "description": project.description,
        "created_at": project.created_at.isoformat() if project.created_at else None,
    }


@router.post("/")
async def create_project(payload: ProjectCreate, db: AsyncSession = Depends(get_db)):
    """Create a new project."""
    valid_types = {"restoration", "protection", "conservation", "hydrology"}
    for pt in payload.project_types:
        if pt not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid project type '{pt}'. Must be one of: {', '.join(sorted(valid_types))}"
            )

    start_date = None
    if payload.start_date:
        try:
            start_date = datetime.date.fromisoformat(payload.start_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD.")

    new_project = Project(
        name=payload.name,
        region=payload.region,
        district=payload.district,
        project_types=payload.project_types,
        start_date=start_date,
        description=payload.description,
    )

    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)

    return {
        "message": "Project created successfully",
        "id": str(new_project.id),
        "name": new_project.name,
    }


@router.put("/{project_id}")
async def update_project(project_id: str, payload: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing project."""
    result = await db.execute(
        select(Project).where(Project.id == uuid.UUID(project_id))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.name is not None:
        project.name = payload.name
    if payload.region is not None:
        project.region = payload.region
    if payload.district is not None:
        project.district = payload.district
    if payload.project_types is not None:
        project.project_types = payload.project_types
    if payload.start_date is not None:
        try:
            project.start_date = datetime.date.fromisoformat(payload.start_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format.")
    if payload.status is not None:
        project.status = payload.status
    if payload.description is not None:
        project.description = payload.description

    await db.commit()

    return {"message": "Project updated", "id": str(project.id)}
