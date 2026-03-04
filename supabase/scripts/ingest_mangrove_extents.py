import os
import json
import psycopg2
import geopandas as gpd
from shapely.wkt import dumps

# Supabase Local Database credentials
DB_HOST = "127.0.0.1"
DB_PORT = "54332"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "postgres"

# Target GEOJSON
KETA_GEOJSON_PATH = "/Users/danielnsowah/Desktop/GAB Climate Smart Ltd/WACA Blue Carbon/02_Outputs/Verified_Extent_4.6m.geojson"

def ingest_mangrove_extents():
    print(f"Loading GeoJSON from: {KETA_GEOJSON_PATH}")
    
    if not os.path.exists(KETA_GEOJSON_PATH):
        print("ERROR: GeoJSON file not found.")
        return

    # Load into GeoPandas
    gdf = gpd.read_file(KETA_GEOJSON_PATH)
    
    # Ensure CRS is EPSG:4326 for Supabase PostGIS
    if gdf.crs != "EPSG:4326":
        print(f"Reprojecting from {gdf.crs} to EPSG:4326")
        gdf = gdf.to_crs("EPSG:4326")

    # Connect to the local Supabase DB
    print("Connecting to local Supabase Postgres instance...")
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    cur = conn.cursor()

    # Clear dummy Keta plots
    print("Clearing old Keta dummy plots...")
    cur.execute("DELETE FROM mangrove_plots WHERE stratum_name LIKE '%Keta%';")

    print(f"Found {len(gdf)} features in the GeoJSON. Ingesting into database...")
    
    inserted_count = 0
    for idx, row in gdf.iterrows():
        geom_wkt = dumps(row.geometry)
        
        # Calculate approximate area in Hectares (if not provided in properties)
        # We can reproject temporarily to a projected CRS (e.g. EPSG:32630 for Ghana) to calculate area
        temp_gdf = gpd.GeoDataFrame(geometry=[row.geometry], crs="EPSG:4326")
        temp_gdf = temp_gdf.to_crs("EPSG:32630")
        area_ha = temp_gdf.geometry.area.iloc[0] / 10000.0
        
        # Construct Stratum name based on the properties or just a generic one for now
        stratum_name = f"Keta Ramsar Verified Extent - Polygon {idx + 1}"

        # Insert into mangrove_plots
        try:
            cur.execute(
                """
                INSERT INTO mangrove_plots (stratum_name, area_ha, geom)
                VALUES (%s, %s, ST_GeomFromText(%s, 4326))
                """,
                (stratum_name, float(area_ha), geom_wkt)
            )
            inserted_count += 1
        except Exception as e:
            print(f"Error inserting polygon {idx}: {e}")
            conn.rollback()

    # Commit transactions
    conn.commit()
    cur.close()
    conn.close()

    print(f"Successfully ingested {inserted_count} mangrove plots into the database.")

if __name__ == "__main__":
    ingest_mangrove_extents()
