import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.services.earth_engine import run_satellite_scan

logger = logging.getLogger(__name__)

# Create a global scheduler instance
scheduler = AsyncIOScheduler()

def start_scheduler():
    """Initialize and start the background scheduler."""
    logger.info("Starting background scheduler...")
    
    # Add a job to run every 7 days. For example, every Monday at 02:00 AM.
    # For testing purposes, we can set this to run more frequently or just rely on the manual trigger.
    scheduler.add_job(
        run_satellite_scan,
        trigger=CronTrigger(day_of_week='mon', hour=2, minute=0),
        id="weekly_satellite_scan",
        name="Weekly Satellite Vegetation Index Scan",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started successfully.")

def shutdown_scheduler():
    """Shutdown the background scheduler."""
    if scheduler.running:
        logger.info("Shutting down background scheduler...")
        scheduler.shutdown()
        logger.info("Scheduler shutdown complete.")
