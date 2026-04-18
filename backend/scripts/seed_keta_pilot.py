import json
import asyncio
import os
import sys

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.database import AsyncSessionLocal
from app.models.polygon import Project, ProjectArea, SamplePlot
from app.models.psp import SamplePlotBoundary
from sqlalchemy import func

def load_geojson(path):
    with open(path, 'r') as f:
        return json.load(f)

async def seed_keta_pilot():
    source_dir = "/Users/danielnsowah/Desktop/Blue-Carbon-Project-Final-Report/source_reports"
    keta_boundary_file = os.path.join(source_dir, "keta_lagoon_boundary.geojson")
    salo_psp_file = os.path.join(source_dir, "salo_permanent_sampla_plot_1_ndmi_03mar2026_boundary.geojson")
    dzita_rest_file = os.path.join(source_dir, "dzita_restoration_areas_ndmi_03mar2026_boundary.geojson")

    async with AsyncSessionLocal() as session:
        # 1. Create the Keta Lagoon Complex Pilot Project
        print("Creating Keta Lagoon Complex Pilot Project...")
        keta_project = Project(
            name="Keta Lagoon Complex Pilot",
            region="Volta",
            district="Keta",
            project_types=["restoration", "conservation"],
            description="Official WACA MRV Pilot Site based on the comprehensive 2025 eco-social baseline."
        )
        session.add(keta_project)
        await session.flush()  # To get the ID
        
        # 2. Add Project Boundary
        print(f"Loading boundary from {keta_boundary_file}")
        if os.path.exists(keta_boundary_file):
            boundary_geojson = load_geojson(keta_boundary_file)
            for feature in boundary_geojson.get("features", []):
                geom_json = json.dumps(feature.get("geometry"))
                area = ProjectArea(
                    project_id=keta_project.id,
                    area_name="Keta Lagoon Boundary",
                    area_type="Boundary",
                    geom=func.ST_Multi(func.ST_SetSRID(func.ST_GeomFromGeoJSON(geom_json), 4326))
                )
                session.add(area)
        else:
            print("Warning: Boundary file not found!")

        # 3. Add Salo PSP
        print(f"Loading Salo PSP from {salo_psp_file}")
        if os.path.exists(salo_psp_file):
            psp_geojson = load_geojson(salo_psp_file)
            for feature in psp_geojson.get("features", []):
                geom_json = json.dumps(feature.get("geometry"))
                # Create the plot point (Centroid of polygon)
                plot = SamplePlot(
                    project_id=keta_project.id,
                    plot_name="Salo Permanent Sample Plot 1",
                    stratum="Restoration",
                    location=func.ST_Centroid(func.ST_SetSRID(func.ST_GeomFromGeoJSON(geom_json), 4326))
                )
                session.add(plot)
                await session.flush()
                
                # Add the boundary
                boundary = SamplePlotBoundary(
                    project_id=keta_project.id,
                    sample_plot_id=plot.id,
                    boundary_name="Salo PSP 1 Footprint",
                    geom=func.ST_Multi(func.ST_SetSRID(func.ST_GeomFromGeoJSON(geom_json), 4326))
                )
                session.add(boundary)

        # 4. Add Dzita Restoration Areas
        print(f"Loading Dzita from {dzita_rest_file}")
        if os.path.exists(dzita_rest_file):
            dzita_geojson = load_geojson(dzita_rest_file)
            for i, feature in enumerate(dzita_geojson.get("features", [])):
                geom_json = json.dumps(feature.get("geometry"))
                area = ProjectArea(
                    project_id=keta_project.id,
                    area_name=f"Dzita Restoration Area {i+1}",
                    area_type="Restoration",
                    geom=func.ST_Multi(func.ST_SetSRID(func.ST_GeomFromGeoJSON(geom_json), 4326))
                )
                session.add(area)

        await session.commit()
        print("Seeding Complete!")

if __name__ == "__main__":
    asyncio.run(seed_keta_pilot())
