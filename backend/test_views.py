import asyncio
from app.db.database import AsyncSessionLocal
from sqlalchemy import text

async def test_views():
    async with AsyncSessionLocal() as session:
        # Check alerts view
        res = await session.execute(text("SELECT count(*) FROM geojson_alerts"))
        alert_count = res.scalar()
        print(f"geojson_alerts view count: {alert_count}")
        
        # Check project areas view
        res = await session.execute(text("SELECT count(*) FROM geojson_project_areas"))
        proj_count = res.scalar()
        print(f"geojson_project_areas view count: {proj_count}")
        
        # Check raw tables just in case
        res = await session.execute(text("SELECT count(*) FROM sar_change_alerts"))
        raw_alert_count = res.scalar()
        print(f"raw sar_change_alerts count: {raw_alert_count}")

if __name__ == "__main__":
    asyncio.run(test_views())
