import asyncio
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.polygon import SARChangeAlert

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(SARChangeAlert))
        alerts = result.scalars().all()
        print(f"Total SARChangeAlerts in database: {len(alerts)}")
        for i, a in enumerate(alerts):
            print(f"[{i}] {a.alert_type} - {a.severity} - Confidence: {a.confidence_score}%")

if __name__ == "__main__":
    asyncio.run(main())
