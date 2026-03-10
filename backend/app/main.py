from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from app.api.routes import polygons, uploads, satellite, projects, governance
from app.services.scheduler import start_scheduler, shutdown_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    start_scheduler()
    yield
    # Shutdown logic
    shutdown_scheduler()

app = FastAPI(title="Blue Carbon MRV API", description="API for Blue Carbon MRV System", lifespan=lifespan)

# Add CORS middleware — origins are configured via CORS_ORIGINS env var
# Accepts a comma-separated list: e.g. "https://app.example.com,https://www.example.com"
_cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
_cors_origins = [origin.strip() for origin in _cors_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(polygons.router, prefix="/api/v1/polygons", tags=["Polygons"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["Uploads"])
app.include_router(satellite.router, prefix="/api/v1/satellite", tags=["Satellite Integration"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(governance.router, prefix="/api/v1/governance", tags=["Governance"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Blue Carbon MRV API is running"}
