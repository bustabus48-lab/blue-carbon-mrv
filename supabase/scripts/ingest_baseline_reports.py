import argparse
import os
import psycopg2


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest baseline reports for any coastal area in Ghana.")
    parser.add_argument("--reports-dir", required=True, help="Directory containing baseline report files")
    parser.add_argument("--coastal-area", required=True, help="Coastal area name")
    parser.add_argument("--district", default=None, help="District name")
    parser.add_argument("--db-host", default=os.getenv("DB_HOST", "127.0.0.1"))
    parser.add_argument("--db-port", default=os.getenv("DB_PORT", "54332"))
    parser.add_argument("--db-name", default=os.getenv("DB_NAME", "postgres"))
    parser.add_argument("--db-user", default=os.getenv("DB_USER", "postgres"))
    parser.add_argument("--db-pass", default=os.getenv("DB_PASS", "postgres"))
    return parser.parse_args()


def infer_doc_type(file_name: str) -> str:
    if 'fpic' in file_name.lower():
        return 'FPIC'
    if 'social' in file_name.lower() or 'socio' in file_name.lower() or 'gender' in file_name.lower():
        return 'Social Impact Assessment'
    if 'governance' in file_name.lower() or 'institution' in file_name.lower():
        return 'Governance Composition'
    if 'benefit' in file_name.lower():
        return 'Benefit-Sharing Agreement'
    return 'Other'


def ingest_baseline_reports(args: argparse.Namespace):
    print(f"Scanning directory for baseline reports: {args.reports_dir}")

    if not os.path.exists(args.reports_dir):
        print("ERROR: Baseline Reports directory not found.")
        return

    reports = [f for f in os.listdir(args.reports_dir) if f.lower().endswith(('.docx', '.pdf'))]
    print(f"Found {len(reports)} report files.")

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
        ) VALUES ('baseline_documents', 'ingest_baseline_reports.py', %s, %s, %s, 'processing', timezone('utc'::text, now()))
        RETURNING id
        """,
        (os.path.basename(args.reports_dir), args.coastal_area, args.district),
    )
    job_id = cur.fetchone()[0]

    inserted_count = 0
    for file_name in reports:
        doc_type = infer_doc_type(file_name)
        try:
            cur.execute(
                """
                INSERT INTO safeguard_documents
                (document_type, community_name, file_url, verification_status, uploaded_by, notes)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    doc_type,
                    args.coastal_area,
                    file_name,
                    'Verified',
                    'baseline@system.local',
                    f'Baseline report ingested for {args.coastal_area}.',
                ),
            )
            inserted_count += 1
        except Exception as exc:
            print(f"Error inserting report {file_name}: {exc}")

    cur.execute(
        """
        UPDATE ingestion_jobs
        SET status = 'completed', total_features = %s, inserted_features = %s, skipped_features = %s,
            completed_at = timezone('utc'::text, now())
        WHERE id = %s
        """,
        (len(reports), inserted_count, len(reports) - inserted_count, str(job_id)),
    )

    conn.commit()
    cur.close()
    conn.close()

    print(f"Successfully ingested {inserted_count} reports. Job ID: {job_id}")


if __name__ == "__main__":
    ingest_baseline_reports(parse_args())
