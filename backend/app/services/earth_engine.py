import logging
from sqlalchemy import select, func
from app.db.database import AsyncSessionLocal
from app.models.polygon import Project, ProjectArea, SARChangeAlert
import datetime

logger = logging.getLogger(__name__)

async def run_satellite_scan():
    """
    Automated satellite scan workflow:
    1. Fetch all active projects.
    2. For each project, find the 'mangrove_extent' polygon.
    3. Run mock NDVI change detection against that extent.
    4. Generate alerts linked to the project.
    """
    logger.info("Starting Automated Satellite Scan...")
    
    async with AsyncSessionLocal() as session:
        # Fetch all active projects
        result = await session.execute(
            select(Project).where(Project.status == 'active')
        )
        projects = result.scalars().all()
        
        logger.info(f"Found {len(projects)} active projects to scan.")
        
        total_alerts = 0
        
        for project in projects:
            logger.info(f"Scanning project: {project.name} (ID: {project.id})")
            
            # Find the mangrove_extent areas for this project
            extent_result = await session.execute(
                select(ProjectArea).where(
                    ProjectArea.project_id == project.id,
                    ProjectArea.area_type == 'mangrove_extent'
                )
            )
            extents = extent_result.scalars().all()
            
            if not extents:
                logger.warning(f"No mangrove_extent layer found for project '{project.name}'. Skipping.")
                continue
            
            for extent in extents:
                logger.info(f"  Processing extent: {extent.area_name} ({extent.area_ha} ha)")
                
                # MOCK LOGIC: Simulate NDVI change detection
                # In production, this would call Google Earth Engine or Sentinel-2 API
                # to clip imagery to the extent polygon and calculate NDVI differences.
                
                alert = SARChangeAlert(
                    alert_type="Deforestation",
                    severity="High",
                    confidence_score=85.5,
                    detected_area_ha=1.5,
                    event_date=datetime.date.today(),
                    project_id=project.id,
                    geom=func.ST_Buffer(func.ST_Centroid(extent.geom), 0.005)  # ~500m radius mock
                )
                
                session.add(alert)
                total_alerts += 1
                logger.info(f"  Generated alert for extent '{extent.area_name}'")
        
        await session.commit()
        logger.info(f"Satellite scan complete. {total_alerts} alerts generated across {len(projects)} projects.")
