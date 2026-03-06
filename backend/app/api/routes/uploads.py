from datetime import datetime, timezone
from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import hashlib
import json

from app.db.database import get_db

router = APIRouter()

VALID_AREA_TYPES = {"restoration", "conservation", "protection", "buffer", "reference"}


@router.post("/spatial")
async def upload_spatial_file(
    file: UploadFile = File(...),
    area_type: str = Form("restoration"),
    coastal_area_name: str | None = Form(None),
    district_name: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest GeoJSON polygons into project_areas and track ingestion with an ingestion_job.
    """
    if not file.filename or (not file.filename.endswith(".geojson") and not file.filename.endswith(".json")):
        raise HTTPException(status_code=400, detail="Only .geojson files are supported")

    normalized_area_type = area_type.strip().lower()
    if normalized_area_type not in VALID_AREA_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid area_type. Expected one of: {', '.join(sorted(VALID_AREA_TYPES))}",
        )

    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()

    job_insert = await db.execute(
        text(
            """
            INSERT INTO public.ingestion_jobs (
                job_type,
                source_name,
                source_file_name,
                source_sha256,
                coastal_area_name,
                district_name,
                area_type,
                status,
                started_at,
                metadata
            )
            VALUES (
                'project_area_upload',
                'spatial_upload_api',
                :source_file_name,
                :source_sha256,
                :coastal_area_name,
                :district_name,
                :area_type,
                'processing',
                :started_at,
                '{}'::jsonb
            )
            RETURNING id
            """
        ),
        {
            "source_file_name": file.filename,
            "source_sha256": file_hash,
            "coastal_area_name": coastal_area_name,
            "district_name": district_name,
            "area_type": normalized_area_type,
            "started_at": datetime.now(timezone.utc),
        },
    )
    job_id = str(job_insert.scalar_one())

    try:
        data = json.loads(content)
        if data.get("type") != "FeatureCollection":
            raise ValueError("File is not a valid GeoJSON FeatureCollection")

        features = data.get("features", [])
        if not features:
            raise ValueError("No features found in uploaded file")

        inserted_count = 0
        skipped_count = 0

        for index, feature in enumerate(features):
            geometry = feature.get("geometry")
            if not geometry:
                skipped_count += 1
                continue

            geometry_type = geometry.get("type")
            if geometry_type not in {"Polygon", "MultiPolygon"}:
                skipped_count += 1
                continue

            properties = feature.get("properties") or {}
            feature_name = (
                properties.get("name")
                or properties.get("area_name")
                or properties.get("plot_name")
                or f"{normalized_area_type.title()} Area {index + 1}"
            )

            area_ha = properties.get("area_ha")
            if area_ha is not None:
                try:
                    area_ha = float(area_ha)
                except (TypeError, ValueError):
                    area_ha = None

            geometry_json = json.dumps(geometry)

            await db.execute(
                text(
                    """
                    INSERT INTO public.project_areas (
                        area_name,
                        area_type,
                        source_file_name,
                        area_ha,
                        properties,
                        geom
                    )
                    VALUES (
                        :area_name,
                        :area_type,
                        :source_file_name,
                        :area_ha,
                        CAST(:properties AS jsonb),
                        ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(:geometry_json), 4326))
                    )
                    """
                ),
                {
                    "area_name": feature_name,
                    "area_type": normalized_area_type,
                    "source_file_name": file.filename,
                    "area_ha": area_ha,
                    "properties": json.dumps(properties),
                    "geometry_json": geometry_json,
                },
            )
            inserted_count += 1

        if inserted_count == 0:
            raise ValueError("No Polygon or MultiPolygon features were inserted")

        await db.execute(
            text(
                """
                UPDATE public.ingestion_jobs
                SET status = 'completed',
                    total_features = :total_features,
                    inserted_features = :inserted_features,
                    skipped_features = :skipped_features,
                    completed_at = :completed_at
                WHERE id = :job_id::uuid
                """
            ),
            {
                "job_id": job_id,
                "total_features": len(features),
                "inserted_features": inserted_count,
                "skipped_features": skipped_count,
                "completed_at": datetime.now(timezone.utc),
            },
        )

        await db.commit()

        return {
            "message": "File ingested successfully",
            "ingestion_job_id": job_id,
            "feature_count": len(features),
            "inserted_count": inserted_count,
            "skipped_count": skipped_count,
            "area_type": normalized_area_type,
            "coastal_area_name": coastal_area_name,
            "district_name": district_name,
        }
    except json.JSONDecodeError:
        await db.execute(
            text(
                """
                UPDATE public.ingestion_jobs
                SET status = 'failed',
                    error_message = :error_message,
                    completed_at = :completed_at
                WHERE id = :job_id::uuid
                """
            ),
            {
                "job_id": job_id,
                "error_message": "Invalid JSON file format",
                "completed_at": datetime.now(timezone.utc),
            },
        )
        await db.commit()
        raise HTTPException(status_code=400, detail="Invalid JSON file format")
    except ValueError as e:
        await db.execute(
            text(
                """
                UPDATE public.ingestion_jobs
                SET status = 'failed',
                    error_message = :error_message,
                    completed_at = :completed_at
                WHERE id = :job_id::uuid
                """
            ),
            {
                "job_id": job_id,
                "error_message": str(e),
                "completed_at": datetime.now(timezone.utc),
            },
        )
        await db.commit()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.execute(
            text(
                """
                UPDATE public.ingestion_jobs
                SET status = 'failed',
                    error_message = :error_message,
                    completed_at = :completed_at
                WHERE id = :job_id::uuid
                """
            ),
            {
                "job_id": job_id,
                "error_message": str(e),
                "completed_at": datetime.now(timezone.utc),
            },
        )
        await db.commit()
        raise HTTPException(status_code=400, detail=f"Failed to ingest file: {str(e)}")
