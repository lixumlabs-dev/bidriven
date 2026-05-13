import duckdb
import os
from datetime import datetime

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STAGING_DIR = os.path.join(BASE_DIR, 'data', 'staging')
WAREHOUSE_PATH = os.path.join(BASE_DIR, 'warehouse', 'bidriven_unified.db')

def load_warehouse():
    print(f"[{datetime.now().isoformat()}] Starting Warehouse Load (DuckDB Simulation)")
    
    # Connect to DuckDB
    con = duckdb.connect(WAREHOUSE_PATH)
    
    # Load Sheets (Sales)
    sheets_path = os.path.join(STAGING_DIR, 'sheets_vendas.parquet')
    if os.path.exists(sheets_path):
        con.execute(f"CREATE OR REPLACE TABLE sales AS SELECT * FROM read_parquet('{sheets_path}')")
        print(f"Loaded sales from {sheets_path}")
    
    # Load API (Leads)
    api_path = os.path.join(STAGING_DIR, 'api_leads.parquet')
    if os.path.exists(api_path):
        con.execute(f"CREATE OR REPLACE TABLE leads AS SELECT * FROM read_parquet('{api_path}')")
        print(f"Loaded leads from {api_path}")
    
    # Summary
    print("\n--- Warehouse Summary ---")
    tables = con.execute("SHOW TABLES").fetchall()
    for table in tables:
        count = con.execute(f"SELECT count(*) FROM {table[0]}").fetchone()[0]
        print(f"Table: {table[0]} | Rows: {count}")
    
    con.close()

if __name__ == "__main__":
    load_warehouse()
