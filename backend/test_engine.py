import asyncio
import logging
from app.services.earth_engine import run_satellite_scan

logging.basicConfig(level=logging.INFO)

async def test():
    print("Testing earth engine background mock...")
    await run_satellite_scan()
    print("Test finished.")

if __name__ == "__main__":
    asyncio.run(test())
