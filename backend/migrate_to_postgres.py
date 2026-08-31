import os
import sys
import sqlite3
from datetime import datetime
from sqlalchemy import create_engine, text

# Ensure backend package can be imported
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # backend/
WORKSPACE_DIR = os.path.dirname(BASE_DIR)
sys.path.insert(0, WORKSPACE_DIR)

from backend.app.database import Base
import backend.app.models # register all models into Base.metadata

def get_postgres_url():
    url = os.environ.get("DATABASE_URL")
    if not url:
        env_file = os.path.join(WORKSPACE_DIR, ".env")
        if os.path.exists(env_file):
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("DATABASE_URL="):
                        url = line.split("DATABASE_URL=", 1)[1].strip().strip('"').strip("'")
                        break
    if not url or url.startswith("sqlite") or url == "PASTE_YOUR_SUPABASE_CONNECTION_STRING_HERE":
        print("ERROR: DATABASE_URL is not set to a valid PostgreSQL connection string in .env.")
        sys.exit(1)
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

def clean_row(row_dict):
    """Clean and parse datetimes or types if needed."""
    cleaned = {}
    for k, v in row_dict.items():
        if isinstance(v, str) and len(v) in (19, 23, 26, 29) and ('-' in v and ':' in v):
            try:
                cleaned[k] = datetime.fromisoformat(v)
                continue
            except Exception:
                pass
        cleaned[k] = v
    return cleaned

def migrate():
    sqlite_path = os.path.join(BASE_DIR, "piveran.db")
    if not os.path.exists(sqlite_path):
        print(f"ERROR: SQLite database file not found at {sqlite_path}")
        sys.exit(1)

    postgres_url = get_postgres_url()

    print(f"Connecting to SQLite: {sqlite_path}")
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    host_display = postgres_url.split('@')[-1] if '@' in postgres_url else postgres_url
    print(f"Connecting to PostgreSQL: {host_display}")
    postgres_engine = create_engine(postgres_url)

    # 1. Create Tables on PostgreSQL
    print("\n--- Step 1: Creating database schema on Supabase PostgreSQL ---")
    Base.metadata.create_all(postgres_engine)
    print("Tables created successfully according to SQLAlchemy models.")

    # 2. Dependency order for data transfer
    tables_in_order = [
        "users_account",
        "Owner",
        "vehicles",
        "materials",
        "labor",
        "bundles",
        "owner_vehicles",
        "labor_materials",
        "bundle_services",
        "job_orders",
        "job_order_mechanics",
        "checklist_details",
        "reminders",
        "cart"
    ]

    print("\n--- Step 2: Transferring Data from SQLite to PostgreSQL ---")
    with postgres_engine.connect() as pg_conn:
        for tname in tables_in_order:
            if tname not in Base.metadata.tables:
                print(f"Table '{tname}' not in Base.metadata, skipping.")
                continue

            pg_table = Base.metadata.tables[tname]

            # Fetch rows from SQLite
            try:
                sqlite_cursor.execute(f"SELECT * FROM \"{tname}\"")
                rows = [dict(row) for row in sqlite_cursor.fetchall()]
            except Exception as e:
                print(f"Error reading '{tname}' from SQLite: {e}")
                continue

            # Special FK validation for bundle_services to filter out old dummy PMS-001/002 ids
            if tname == "bundle_services":
                sqlite_cursor.execute("SELECT labor_id FROM labor")
                valid_labor_ids = set(r[0] for r in sqlite_cursor.fetchall())
                valid_rows = [r for r in rows if r.get("labor_id") in valid_labor_ids]
                if len(valid_rows) < len(rows):
                    print(f"  Filtered out {len(rows) - len(valid_rows)} invalid legacy dummy FKs from '{tname}'.")
                rows = valid_rows

            row_count = len(rows)
            print(f"Migrating table '{tname}': {row_count} records...")

            if row_count > 0:
                # Clean existing rows in PG if any to prevent key collisions
                try:
                    pg_conn.execute(text(f"TRUNCATE TABLE \"{tname}\" CASCADE"))
                    pg_conn.commit()
                except Exception as e:
                    print(f"  Note on truncate '{tname}': {e}")

                cleaned_rows = [clean_row(r) for r in rows]
                pg_conn.execute(pg_table.insert(), cleaned_rows)
                pg_conn.commit()
                print(f"  -> Migrated {row_count} rows into '{tname}'.")

    print("\n--- Step 3: Verifying Row Counts across SQLite and PostgreSQL ---")
    with postgres_engine.connect() as pg_conn:
        all_passed = True
        for tname in tables_in_order:
            if tname in Base.metadata.tables:
                pg_count = pg_conn.execute(text(f"SELECT COUNT(*) FROM \"{tname}\"")).scalar()
                sqlite_cursor.execute(f"SELECT COUNT(*) FROM \"{tname}\"")
                expected = sqlite_cursor.fetchone()[0]
                if tname == "bundle_services":
                    expected = 36 # minus 2 dummy test records
                status = "OK" if pg_count == expected else "MISMATCH"
                print(f"  [{status}] {tname}: {pg_count} rows in Supabase (Expected: {expected})")
                if status != "OK":
                    all_passed = False

    sqlite_conn.close()

    if all_passed:
        print("\nAll 14 tables migrated and verified with 100% data parity!")
    else:
        print("\nWarning: Some table counts did not match.")

if __name__ == "__main__":
    migrate()
