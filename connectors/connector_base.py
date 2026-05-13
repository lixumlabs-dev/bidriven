import os
import json
import pandas as pd
from datetime import datetime

class BiDrivenConnector:
    def __init__(self, source_name):
        self.source_name = source_name
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    def log(self, message):
        print(f"[{datetime.now().isoformat()}] [{self.source_name}] {message}")

    def save_to_staging(self, df, output_path):
        """Simulates saving to S3 Staging area"""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_parquet(output_path, index=False)
        self.log(f"Saved {len(df)} rows to {output_path}")

# Example usage for Sheets
def ingest_sheets(csv_path, staging_path):
    connector = BiDrivenConnector("GoogleSheets")
    connector.log(f"Starting ingestion from {csv_path}")
    
    # Load
    df = pd.read_csv(csv_path)
    
    # Transform (Simple cleanup)
    df['ingested_at'] = datetime.now().isoformat()
    df['source'] = 'google_sheets'
    
    # Save
    connector.save_to_staging(df, staging_path)

if __name__ == "__main__":
    # Test path
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_file = os.path.join(base_dir, 'data', 'simulated', 'sheets_vendas.csv')
    staging_file = os.path.join(base_dir, 'data', 'staging', 'sheets_vendas.parquet')
    
    try:
        import fastparquet
        ingest_sheets(csv_file, staging_file)
    except ImportError:
        print("Please install 'pandas' and 'fastparquet' to run this connector.")
