import argparse
import os
import psycopg2
import geopandas as gpd
from shapely.wkt import dumps


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest mangrove extent polygons for any coastal area in Ghana.")
    parser.add_argument("--geojson", required=True, help="Path to GeoJSON extent file")
    parser.add_argument("--coastal-area", required=True, help="Coastal area name (e.g., Keta Lagoon Complex)")
    parser.add_argument("--district", default=None, help="District name")
    parser.add_argument("--db-host", default=os.getenv("DB_HOST", "127.0.0.1"))
    parser.add_argument("--db-port", default=os.getenv("DB_PORT", "54332"))
    parser.add_argument("--db-name", default=os.getenv("DB_NAME", "postgres"))
    parser.add_argument("--db-user", default=os.getenv("DB_USER", "postgres"))
    parser.add_argument("--db-pass", default=os.getenv("DB_PASS", "postgres"))
    return parser.parse_args()


def ingest_mangrove_extents(args: argparse.Namespace):
    print(f"Loading GeoJSON from: {args.geojson}")

    if not os.path.exists(args.geojson):
        print("ERROR: GeoJSON file not found.")
        return

    gdf = gpd.read_file(args.geojson)
    if gdf.crs != "EPSG:4326":
        print(f"Reprojecting from {gdf.crs} to EPSG:4326")
        gdf = gdf.to_crs("EPSG:4326")

    conn = psycopg2.connect(
        host=args.db_host,
        port=args.db_port,
        dbname=args.db_name,
        user=args.db_user,
        password=args.db_pass,
    )
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO ingestion_jobs (
            job_type, source_name, source_file_name, coastal_area_name, district_name, status, started_at
        ) VALUES ('baseline_spatial', 'ingest_mangrove_extents.py', %s, %s, %s, 'processing', timezone('utc'::text, now()))
        RETURNING id
        """,
        (os.path.basename(args.geojson), args.coastal_area, args.district),
    )
    job_id = cur.fetchone()[0]

    inserted_count = 0
    skipped_count = 0

    for idx, row in gdf.iterrows():
        if row.geometry is None:
            skipped_count += 1
            continue

        geom_wkt = dumps(row.geometry)
        temp_gdf = gpd.GeoDataFrame(geometry=[row.geometry], crs="EPSG:4326").to_crs("EPSG:32630")
        area_ha = temp_gdf.geometry.area.iloc[0] / 10000.0

        stratum_name = row.get("stratum") or f"{args.coastal_area} Extent - Polygon {idx + 1}"

        try:
            cur.execute(
                """
                INSERT INTO mangrove_plots (stratum_name, area_ha, geom)
                VALUES (%s, %s, ST_GeomFromText(%s, 4326))
                """,
                (stratum_name, float(area_ha), geom_wkt),
            )
            inserted_count += 1
        except Exception as exc:
            print(f"Error inserting polygon {idx}: {exc}")
            skipped_count += 1

    cur.execute(
        """
        UPDATE ingestion_jobs
        SET status = 'completed', total_features = %s, inserted_features = %s, skipped_features = %s,
            completed_at = timezone('utc'::text, now())
        WHERE id = %s
        """,
        (len(gdf), inserted_count, skipped_count, str(job_id)),
    )

    conn.commit()
    cur.close()
    conn.close()

    print(f"Successfully ingested {inserted_count} features for {args.coastal_area}. Job ID: {job_id}")


if __name__ == "__main__":
    ingest_mangrove_extents(parse_args())
