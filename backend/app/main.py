from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.routes import polygons, uploads, satellite, projects
from app.services.scheduler import start_scheduler, shutdown_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    start_scheduler()
    yield
    # Shutdown logic
    shutdown_scheduler()

app = FastAPI(title="Blue Carbon MRV API", description="API for Blue Carbon MRV System", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(polygons.router, prefix="/api/v1/polygons", tags=["Polygons"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["Uploads"])
app.include_router(satellite.router, prefix="/api/v1/satellite", tags=["Satellite Integration"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Blue Carbon MRV API is running"}
