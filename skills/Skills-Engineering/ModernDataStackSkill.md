# Modern Data Stack Skill (OSS Focus) - BiDriven

Esta skill foca na utilização de ferramentas Open-Source e Cloud-Native para maximizar a escalabilidade e minimizar custos (TCO).

## 1. Arquitetura de Referência (The "BiDriven" Stack)
- **Ingestão:** Airbyte Open Source ou Scripts Python customizados.
- **Storage:** PostgreSQL (Transacional/Staging) + DuckDB (Analítico/Local).
- **Transformação:** dbt Core (CLI) para modelagem SQL versionada.
- **Orquestração:** Dagster (Local/OSS) para controle de assets.
- **Visualização:** Metabase ou Apache Superset para dashboards democráticos.

## 2. Padrões de Modelagem
### Star Schema (Obrigatório para Marts)
- **Fatos:** Tabelas de eventos, métricas e transações (ex: `fct_vendas`).
- **Dimensões:** Tabelas de contexto, descritivas (ex: `dim_clientes`, `dim_produtos`).
- **Nomenclatura:** Prefixo `fct_` para fatos e `dim_` para dimensões.

### Data Vault 2.0 (Opcional para Raw/Hubs)
- Útil para sistemas com muitas fontes e histórico complexo.
- Separar Dados Brutos (Raw Vault) de Regras de Negócio (Business Vault).

## 3. Fluxo de Trabalho (Data as Code)
1. **Develop:** Alterações feitas em branch local.
2. **Test:** Rodar `dbt test` ou Great Expectations.
3. **Deploy:** Merge em `main` dispara CI/CD para o ambiente de produção.
4. **Monitor:** Dashboards de observabilidade checam saúde dos pipelines.

## 4. Melhores Práticas
- **ELT over ETL:** Carregue os dados primeiro e transforme dentro do banco para aproveitar o poder de processamento do DB.
- **Modularidade:** Quebre modelos dbt complexos em modelos menores e reutilizáveis (CTE patterns).
- **Idempotência:** Garanta que rodar o mesmo pipeline duas vezes não gere dados duplicados ou inconsistentes.
