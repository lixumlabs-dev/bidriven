import os
import json
import pandas as pd
from connector_base import BiDrivenConnector

def ingest_api(json_path, staging_path):
    connector = BiDrivenConnector("CustomerAPI")
    connector.log(f"Starting ingestion from {json_path}")
    
    # Load
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    # Transform
    df['ingested_at'] = pd.Timestamp.now()
    df['source'] = 'leads_api'
    
    # Save
    connector.save_to_staging(df, staging_path)

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_file = os.path.join(base_dir, 'data', 'simulated', 'api_leads.json')
    staging_file = os.path.join(base_dir, 'data', 'staging', 'api_leads.parquet')
    
    try:
        ingest_api(json_file, staging_file)
    except Exception as e:
        print(f"Error: {e}")
