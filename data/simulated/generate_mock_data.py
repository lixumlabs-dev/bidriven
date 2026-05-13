import csv
import json
import random
import os
from datetime import datetime, timedelta

# Setup paths
DATA_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_sheets_mock(n=100):
    """Simulates Google Sheets data (Sales)"""
    file_path = os.path.join(DATA_DIR, 'sheets_vendas.csv')
    headers = ['id_venda', 'data', 'produto', 'valor', 'vendedor', 'regiao']
    produtos = ['BI Dashboard Pro', 'Data Connector Lite', 'Consultoria DataOps', 'AI Agent Setup']
    vendedores = ['Alice Silva', 'Bruno Santos', 'Carla Oliveira', 'Diego Costa']
    regioes = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro-Oeste']

    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for i in range(1, n + 1):
            data = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d')
            writer.writerow([
                f'V-{i:04d}',
                data,
                random.choice(produtos),
                round(random.uniform(500, 5000), 2),
                random.choice(vendedores),
                random.choice(regioes)
            ])
    print(f"Generated: {file_path}")

def generate_api_mock(n=50):
    """Simulates API JSON data (Customer Leads)"""
    file_path = os.path.join(DATA_DIR, 'api_leads.json')
    leads = []
    status_options = ['new', 'contacted', 'qualified', 'closed', 'lost']
    sources = ['Google Ads', 'LinkedIn', 'Organic', 'Referral']

    for i in range(1, n + 1):
        leads.append({
            'lead_id': i,
            'name': f'Lead Name {i}',
            'email': f'lead{i}@example.com',
            'source': random.choice(sources),
            'status': random.choice(status_options),
            'created_at': (datetime.now() - timedelta(days=random.randint(0, 15))).isoformat(),
            'score': random.randint(1, 100)
        })

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(leads, f, indent=2, ensure_ascii=False)
    print(f"Generated: {file_path}")

def generate_db_mock(n=30):
    """Simulates Legacy SQL data (Products Catalog)"""
    file_path = os.path.join(DATA_DIR, 'legacy_db.sql')
    categories = ['Software', 'Hardware', 'Service', 'Education']
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write("CREATE TABLE IF NOT EXISTS legacy_products (\n")
        f.write("    id SERIAL PRIMARY KEY,\n")
        f.write("    sku VARCHAR(50) UNIQUE,\n")
        f.write("    name VARCHAR(255),\n")
        f.write("    category VARCHAR(100),\n")
        f.write("    price DECIMAL(10,2),\n")
        f.write("    stock_count INT\n")
        f.write(");\n\n")
        f.write("INSERT INTO legacy_products (sku, name, category, price, stock_count) VALUES\n")
        
        values = []
        for i in range(1, n + 1):
            sku = f'SKU-{random.randint(1000, 9999)}'
            name = f'Product {i}'
            cat = random.choice(categories)
            price = round(random.uniform(10, 1000), 2)
            stock = random.randint(0, 500)
            values.append(f"('{sku}', '{name}', '{cat}', {price}, {stock})")
        
        f.write(",\n".join(values) + ";")
    print(f"Generated: {file_path}")

if __name__ == "__main__":
    generate_sheets_mock()
    generate_api_mock()
    generate_db_mock()
