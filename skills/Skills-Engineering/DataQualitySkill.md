# Data Quality Skill - BiDriven

Esta skill define o padrão de ouro para a integridade dos dados no projeto BiDriven.

## 1. Princípios de Qualidade
- **Completude:** Não aceitar campos críticos nulos (ex: IDs de transação, datas).
- **Acurácia:** Os dados devem bater com a fonte de origem (verificação via checksum).
- **Consistência:** O mesmo dado não deve ter valores conflitantes em tabelas diferentes.
- **Atualidade (Freshness):** Monitorar o atraso (lag) dos dados em relação ao tempo real.

## 2. Checklist de Ingestão (Data Engineer)
- [ ] Validar schema (tipos de dados) antes do load.
- [ ] Checar duplicidade de chaves primárias.
- [ ] Verificar contagem de linhas entre Source e Staging.
- [ ] Registrar logs de erro em caso de truncamento.

## 3. Checklist de Transformação (Analytics Engineer)
- [ ] Teste de Unicidade: Garantir que chaves não se duplicam após joins.
- [ ] Teste de Relacionamento: Validar chaves estrangeiras (Foreign Keys).
- [ ] Teste de Valores Aceitos: Validar campos de status ou categorias.
- [ ] Documentação: Todas as colunas de negócio devem ter `@description`.

## 4. Ferramentas Recomendadas
- **Great Expectations:** Para validação declarativa.
- **dbt tests:** Para testes integrados na modelagem.
- **Python Checkers:** Scripts customizados para validações complexas.

## 5. Protocolo de Erro
- Se um teste falhar em **Staging**, o pipeline deve parar (Fail Fast).
- Se um teste falhar em **Production**, disparar alerta imediato e manter dados anteriores se possível.
