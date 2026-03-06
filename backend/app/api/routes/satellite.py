from fastapi import APIRouter, BackgroundTasks
from app.services.earth_engine import run_satellite_scan

router = APIRouter()

@router.post("/trigger-scan")
async def trigger_satellite_scan(background_tasks: BackgroundTasks):
    """
    Manually triggers the 7-day automated satellite scan pipeline.
    This runs the scanning job in the background and returns immediately.
    """
    # BackgroundTasks is provided by FastAPI to run non-blocking tasks
    background_tasks.add_task(run_satellite_scan)
    return {"status": "success", "message": "Satellite scan triggered and is running in the background."}
