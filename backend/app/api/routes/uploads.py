from datetime import datetime, timezone
from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import hashlib
import json
import tempfile
import os

from app.db.database import get_db

router = APIRouter()

VALID_AREA_TYPES = {
    "restoration", "conservation", "protection", "buffer", "reference",
    "hydrology", "mangrove_extent", "project_boundary"
}


@router.post("/spatial")
async def upload_spatial_file(
    file: UploadFile = File(...),
    area_type: str = Form("restoration"),
    coastal_area_name: str | None = Form(None),
    district_name: str | None = Form(None),
    project_id: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest GeoJSON polygons into project_areas and track ingestion with an ingestion_job.
    Supports GeoJSON, KML, and TIFF (GeoTIFF) file formats.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    filename = file.filename.lower()
    is_geojson = filename.endswith(".geojson") or filename.endswith(".json")
    is_kml = filename.endswith(".kml")
    is_tiff = filename.endswith(".tif") or filename.endswith(".tiff")

    if not (is_geojson or is_kml or is_tiff):
        raise HTTPException(status_code=400, detail="Only .geojson, .kml, and .tif(f) files are supported")

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
        features = []

        if is_geojson:
            data = json.loads(content)
            if data.get("type") != "FeatureCollection":
                raise ValueError("File is not a valid GeoJSON FeatureCollection")
            features = data.get("features", [])

        elif is_kml:
            import geopandas as gpd
            import fiona
            fiona.drvsupport.supported_drivers['KML'] = 'rw'

            with tempfile.NamedTemporaryFile(suffix=".kml", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name

            try:
                gdf = gpd.read_file(tmp_path, driver='KML')
                if gdf.crs is not None and gdf.crs.to_epsg() != 4326:
                    gdf = gdf.to_crs(epsg=4326)
                geojson_str = gdf.to_json()
                data = json.loads(geojson_str)
                features = data.get("features", [])
            finally:
                os.unlink(tmp_path)

        elif is_tiff:
            import rasterio
            from rasterio.features import shapes

            with tempfile.NamedTemporaryFile(suffix=".tif", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name

            try:
                with rasterio.open(tmp_path) as src:
                    image = src.read(1)
                    mask = (image > 0) & (src.read_masks(1) > 0)
                    src_crs = src.crs

                    features_extracted = []
                    for geom, val in shapes(image, mask=mask, transform=src.transform):
                        features_extracted.append({"type": "Feature", "geometry": geom, "properties": {"value": val}})

                    if src_crs and src_crs.to_epsg() != 4326:
                        import geopandas as gpd
                        gdf = gpd.GeoDataFrame.from_features(features_extracted, crs=src_crs)
                        gdf = gdf.to_crs(epsg=4326)
                        data = json.loads(gdf.to_json())
                        features = data.get("features", [])
                    else:
                        features = features_extracted
            finally:
                os.unlink(tmp_path)

        if not features:
            raise ValueError("No valid features found in uploaded file")

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
                    INSERT INTO public.project_areas (area_name, area_type, source_file_name, area_ha, properties, project_id, geom)
                    VALUES (
                        :area_name,
                        :area_type,
                        :source_file_name,
                        :area_ha,
                        CAST(:properties AS jsonb),
                        CAST(:project_id AS uuid),
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
                    "project_id": project_id if project_id else None,
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
