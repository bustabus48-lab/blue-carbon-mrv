import os
import psycopg2

# Supabase Local Database credentials
DB_HOST = "127.0.0.1"
DB_PORT = "54332"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "postgres"

BASELINE_REPORTS_DIR = "/Users/danielnsowah/Desktop/blue-carbon-mrv/docs/Baseline Reports"

def ingest_baseline_reports():
    print(f"Scanning directory for Baseline Reports: {BASELINE_REPORTS_DIR}")
    
    if not os.path.exists(BASELINE_REPORTS_DIR):
        print("ERROR: Baseline Reports directory not found.")
        return

    reports = [f for f in os.listdir(BASELINE_REPORTS_DIR) if f.endswith('.docx')]
    print(f"Found {len(reports)} docx baseline reports.")

    print("Connecting to local Supabase Postgres instance...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        return

    # Clear old dummy documents
    print("Clearing old dummy safeguard documents...")
    cur.execute("DELETE FROM safeguard_documents;")

    inserted_count = 0
    for file_name in reports:
        # Determine document type based on filename heuristically
        doc_type = 'Other'
        if 'Social' in file_name or 'Socio' in file_name:
            doc_type = 'Social Impact Assessment'
        elif 'Governance' in file_name or 'Institution' in file_name:
            doc_type = 'Governance Composition'
        elif 'Gender' in file_name:
            doc_type = 'Social Impact Assessment'

        # Insert into safeguard_documents
        try:
            cur.execute(
                """
                INSERT INTO safeguard_documents 
                (document_type, community_name, file_url, verification_status, uploaded_by, notes)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    doc_type, 
                    'Keta Lagoon Complex',  # Assuming Keta for baseline
                    file_name,              # We store just the filename for UI display
                    'Verified',             
                    'admin@gab.com',        # Uploader
                    'Official Baseline Report ingested from initial WACA survey.'
                )
            )
            inserted_count += 1
        except Exception as e:
            print(f"Error inserting report {file_name}: {e}")
            conn.rollback()

    # Commit transactions
    conn.commit()
    cur.close()
    conn.close()

    print(f"Successfully ingested {inserted_count} Baseline Reports into the Safeguards Registry.")

if __name__ == "__main__":
    ingest_baseline_reports()
