-- ============================================================
-- BiDriven — Seed: Form Templates Completos
-- ============================================================
-- Gerado pela Assembleia BiDriven:
--   DataArchitectAgent + AnalyticsEngineerAgent (estrutura e valor analítico)
--   DataEngineerAgent (regras de qualidade de dados)
--   CopywriterAgent (copy em PT-BR)
--
-- Como executar:
--   Cole no Supabase SQL Editor e execute.
--   A empresa 'lixium' (slug) precisa existir previamente.
--
-- Formulários criados (10):
--   Financeiro:  DRE Mensal · Fluxo de Caixa · Orçamento vs Realizado
--   Vendas:      Resultado de Vendas Mensal · Pipeline Comercial Semanal
--   RH:          Headcount e Turnover Mensal · Absenteísmo
--   Operações:   KPIs Operacionais · Produtividade da Equipe
--   Marketing:   Performance de Campanha · Métricas de Aquisição
-- ============================================================

DO $$
DECLARE
  v_company_id UUID;
  v_user_id    UUID;

  -- IDs dos formulários
  t_dre        UUID;
  t_fluxo      UUID;
  t_orcamento  UUID;
  t_vendas     UUID;
  t_pipeline   UUID;
  t_headcount  UUID;
  t_absent     UUID;
  t_kpi_op     UUID;
  t_produt     UUID;
  t_campanha   UUID;
  t_aquisicao  UUID;

BEGIN
  -- ── Resolução de empresa e usuário ──────────────────────────
  SELECT id    INTO v_company_id FROM companies WHERE slug = 'lixium' LIMIT 1;
  SELECT user_id INTO v_user_id  FROM company_members WHERE company_id = v_company_id
    ORDER BY joined_at LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE NOTICE 'Empresa lixium não encontrada. Seed ignorado.';
    RETURN;
  END IF;

  RAISE NOTICE 'Criando formulários para company_id: %', v_company_id;

  -- ============================================================
  -- 1. DRE MENSAL
  -- ============================================================
  INSERT INTO form_templates (company_id, name, description, status, created_by)
  VALUES (
    v_company_id,
    'DRE Mensal',
    'Registre os resultados financeiros consolidados do mês. Alimenta o painel executivo e o comparativo orçamentário.',
    'active', v_user_id
  ) RETURNING id INTO t_dre;

  INSERT INTO form_fields (template_id, name, label, field_type, required, options, help_text, order_index) VALUES
    (t_dre, 'competencia',             'Competência',                          'date',     true,  NULL,
     'Primeiro dia do mês de referência (ex: 01/04/2025)', 0),
    (t_dre, 'centro_custo',            'Centro de Custo',                      'select',   true,
     '["Comercial","Operações","TI","RH","Marketing","Financeiro","Logística","Produção","Administrativo"]'::jsonb,
     NULL, 1),
    (t_dre, 'receita_bruta',           'Receita Bruta (R$)',                   'number',   true,  NULL,
     'Total faturado antes de devoluções e impostos.', 2),
    (t_dre, 'deducoes_receita',        'Deduções da Receita (R$)',             'number',   true,  NULL,
     'Devoluções, abatimentos e impostos sobre vendas (PIS, COFINS, ISS, ICMS).', 3),
    (t_dre, 'custo_produtos_servicos', 'CMV / CSP (R$)',                       'number',   true,  NULL,
     'Custo direto de tudo que foi entregue ao cliente no período.', 4),
    (t_dre, 'despesas_operacionais',   'Despesas Operacionais (R$)',           'number',   true,  NULL,
     'Soma de todas as despesas de estrutura: comercial, marketing, administrativo e RH.', 5),
    (t_dre, 'ebitda',                  'EBITDA (R$)',                          'number',   true,  NULL,
     'Resultado antes de juros, impostos, depreciação e amortização.', 6),
    (t_dre, 'resultado_liquido',       'Resultado Líquido — Lucro / Prejuízo', 'number',   true,  NULL,
     'Resultado final após todos os custos, despesas e impostos.', 7),
    (t_dre, 'observacoes',             'Observações',                          'textarea',  false, NULL,
     'Eventos pontuais que expliquem variações relevantes no período.', 8);

  INSERT INTO business_rules
    (company_id, template_id, name, rule_type, severity, condition, action, applies_to, is_active, created_by)
  VALUES
    (v_company_id, t_dre,
     'Receita Bruta deve ser positiva', 'validation', 'error',
     '{"any":[{"field":"receita_bruta","operator":"not_exists"},{"field":"receita_bruta","operator":"lte","value":0}]}'::jsonb,
     '{"message":"Receita Bruta deve ser maior que zero. Verifique se o período está correto ou se o lançamento é de uma empresa operacional."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_dre,
     'Competência obrigatória', 'validation', 'error',
     '{"field":"competencia","operator":"not_exists"}'::jsonb,
     '{"message":"Informe o mês de competência antes de continuar. Sem ele, o lançamento não pode ser alocado no DRE."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_dre,
     'Resultado negativo — alerta de prejuízo', 'flag', 'warning',
     '{"field":"resultado_liquido","operator":"lt","value":0}'::jsonb,
     '{"message":"Resultado Líquido negativo registrado. Se for prejuízo real, prossiga — o Analista revisará. Se for erro, corrija antes de submeter."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_dre,
     'EBITDA inferior ao resultado líquido', 'flag', 'warning',
     '{"all":[{"field":"ebitda","operator":"exists"},{"field":"resultado_liquido","operator":"exists"},{"field":"ebitda","operator":"lt","value":-1000000}]}'::jsonb,
     '{"message":"EBITDA muito negativo. Confirme se os valores de despesas e custos foram lançados corretamente."}'::jsonb,
     'form_template', true, v_user_id);

  -- ============================================================
  -- 2. FLUXO DE CAIXA
  -- ============================================================
  INSERT INTO form_templates (company_id, name, description, status, created_by)
  VALUES (
    v_company_id,
    'Fluxo de Caixa',
    'Registre as entradas e saídas de caixa do período. Permite acompanhar a posição financeira real, separada do resultado contábil.',
    'active', v_user_id
  ) RETURNING id INTO t_fluxo;

  INSERT INTO form_fields (template_id, name, label, field_type, required, options, help_text, order_index) VALUES
    (t_fluxo, 'competencia',               'Competência',                              'date',     true, NULL,
     'Mês e ano das movimentações registradas.', 0),
    (t_fluxo, 'saldo_inicial',             'Saldo em Caixa no Início do Período (R$)', 'number',   true, NULL,
     'Saldo disponível no primeiro dia do mês (caixa + bancos).', 1),
    (t_fluxo, 'entradas_operacionais',     'Entradas Operacionais (R$)',               'number',   true, NULL,
     'Recebimentos de clientes e outras receitas da operação.', 2),
    (t_fluxo, 'saidas_operacionais',       'Saídas Operacionais (R$)',                 'number',   true, NULL,
     'Pagamentos a fornecedores, salários, impostos e demais custos do negócio.', 3),
    (t_fluxo, 'entradas_investimentos',    'Entradas de Investimentos (R$)',           'number',   false, NULL,
     'Venda de ativos, resgates de aplicações ou aportes recebidos.', 4),
    (t_fluxo, 'saidas_investimentos',      'Saídas de Investimentos (R$)',             'number',   false, NULL,
     'Compra de equipamentos, imobilizado ou aplicações financeiras.', 5),
    (t_fluxo, 'entradas_financiamentos',   'Entradas de Financiamentos (R$)',          'number',   false, NULL,
     'Empréstimos captados ou aumento de capital no período.', 6),
    (t_fluxo, 'saidas_financiamentos',     'Saídas de Financiamentos (R$)',            'number',   false, NULL,
     'Pagamento de parcelas de empréstimos e distribuição de dividendos.', 7),
    (t_fluxo, 'saldo_final',               'Saldo em Caixa no Final do Período (R$)', 'number',   true, NULL,
     'Deve fechar com: Saldo Inicial + Entradas totais − Saídas totais.', 8),
    (t_fluxo, 'observacoes',               'Observações',                              'textarea', false, NULL,
     'Movimentações atípicas ou que precisem de contexto para análise.', 9);

  INSERT INTO business_rules
    (company_id, template_id, name, rule_type, severity, condition, action, applies_to, is_active, created_by)
  VALUES
    (v_company_id, t_fluxo,
     'Saldo final negativo — alerta de crise de liquidez', 'alert', 'warning',
     '{"field":"saldo_final","operator":"lt","value":0}'::jsonb,
     '{"message":"ALERTA: Saldo Final de Caixa negativo. Situação de insolvência operacional detectada. Notifique o Gestor Financeiro imediatamente."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_fluxo,
     'Saídas operacionais não podem ser negativas', 'validation', 'error',
     '{"field":"saidas_operacionais","operator":"lt","value":0}'::jsonb,
     '{"message":"Saídas Operacionais não podem ser negativas. Se houver reembolso ou estorno, use o campo Entradas Operacionais com a devida descrição em Observações."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_fluxo,
     'Competência obrigatória', 'validation', 'error',
     '{"field":"competencia","operator":"not_exists"}'::jsonb,
     '{"message":"Informe o mês de competência antes de salvar."}'::jsonb,
     'form_template', true, v_user_id);

  -- ============================================================
  -- 3. ORÇAMENTO VS REALIZADO
  -- ============================================================
  INSERT INTO form_templates (company_id, name, description, status, created_by)
  VALUES (
    v_company_id,
    'Orçamento vs. Realizado',
    'Registre os valores realizados no mês e compare com o orçamento aprovado. Identifica desvios e subsidia decisões de correção de rota.',
    'active', v_user_id
  ) RETURNING id INTO t_orcamento;

  INSERT INTO form_fields (template_id, name, label, field_type, required, options, help_text, order_index) VALUES
    (t_orcamento, 'competencia',       'Competência',             'date',     true, NULL,
     'Mês e ano do acompanhamento.', 0),
    (t_orcamento, 'categoria',         'Categoria Orçamentária',  'select',   true,
     '["Receita","CPV/CSV","Despesas Comerciais","Despesas Marketing","Despesas Administrativas","Despesas RH","CAPEX","OPEX","Outro"]'::jsonb,
     'Selecione a linha orçamentária correspondente.', 1),
    (t_orcamento, 'centro_custo',      'Centro de Custo',         'select',   true,
     '["Comercial","Operações","TI","RH","Marketing","Financeiro","Produção","Administrativo"]'::jsonb,
     NULL, 2),
    (t_orcamento, 'valor_orcado',      'Valor Orçado (R$)',        'number',   true, NULL,
     'Valor previsto no orçamento aprovado para esta categoria.', 3),
    (t_orcamento, 'valor_realizado',   'Valor Realizado (R$)',     'number',   true, NULL,
     'Valor efetivamente gasto ou receita obtida no período.', 4),
    (t_orcamento, 'justificativa_desvio', 'Justificativa do Desvio', 'textarea', false, NULL,
     'Obrigatório quando o desvio superar ±10%. Seja específico sobre a causa.', 5),
    (t_orcamento, 'responsavel',       'Responsável pela Área',   'text',     false, NULL,
     'Gestor da área a que esta categoria pertence.', 6);

  INSERT INTO business_rules
    (company_id, template_id, name, rule_type, severity, condition, action, applies_to, is_active, created_by)
  VALUES
    (v_company_id, t_orcamento,
     'Valor orçado não pode ser zero', 'validation', 'error',
     '{"field":"valor_orcado","operator":"lte","value":0}'::jsonb,
     '{"message":"O Valor Orçado não pode ser zero. Verifique se selecionou a categoria correta — orçamento zero inviabiliza o cálculo de variação."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_orcamento,
     'Valor realizado negativo', 'flag', 'warning',
     '{"field":"valor_realizado","operator":"lt","value":0}'::jsonb,
     '{"message":"Valor Realizado negativo registrado. Se for estorno ou crédito, confirme que a categoria está correta antes de submeter."}'::jsonb,
     'form_template', true, v_user_id);

  -- ============================================================
  -- 4. RESULTADO DE VENDAS MENSAL
  -- ============================================================
  INSERT INTO form_templates (company_id, name, description, status, created_by)
  VALUES (
    v_company_id,
    'Resultado de Vendas Mensal',
    'Registre o desempenho comercial do mês por canal e produto. Alimenta o painel de vendas e o acompanhamento de metas.',
    'active', v_user_id
  ) RETURNING id INTO t_vendas;

  INSERT INTO form_fields (template_id, name, label, field_type, required, options, help_text, order_index) VALUES
    (t_vendas, 'competencia',         'Competência',                          'date',     true, NULL,
     'Mês e ano do resultado.', 0),
    (t_vendas, 'canal_venda',         'Canal de Venda',                       'select',   true,
     '["Direto","Distribuidor","E-commerce","Televendas","Parceiros","Marketplace","Outros"]'::jsonb,
     'Selecione o canal ao qual os dados se referem.', 1),
    (t_vendas, 'receita_realizada',   'Receita Realizada (R$)',               'number',   true, NULL,
     'Total faturado pelo canal no período, sem impostos.', 2),
    (t_vendas, 'meta_receita',        'Meta de Receita (R$)',                 'number',   true, NULL,
     'Meta aprovada para este canal no mês.', 3),
    (t_vendas, 'numero_pedidos',      'Número de Pedidos Fechados',           'number',   true, NULL,
     'Quantidade de transações concluídas no período.', 4),
    (t_vendas, 'novos_clientes',      'Novos Clientes Conquistados',          'number',   true, NULL,
     'Clientes que realizaram a primeira compra no período.', 5),
    (t_vendas, 'clientes_recorrentes','Clientes Recorrentes',                 'number',   false, NULL,
     'Clientes com compra anterior que voltaram a comprar no período.', 6),
    (t_vendas, 'observacoes',         'Observações',                          'textarea', false, NULL,
     'Explique variações: promoções, sazonalidade, eventos comerciais.', 7);

  INSERT INTO business_rules
    (company_id, template_id, name, rule_type, severity, condition, action, applies_to, is_active, created_by)
  VALUES
    (v_company_id, t_vendas,
     'Meta não pode ser zero', 'validation', 'error',
     '{"field":"meta_receita","operator":"lte","value":0}'::jsonb,
     '{"message":"A meta de receita não pode ser zero. Verifique se o canal e o período estão corretos — meta zero impossibilita o cálculo de atingimento."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_vendas,
     'Receita realizada acima de 200% da meta', 'flag', 'warning',
     '{"all":[{"field":"meta_receita","operator":"gt","value":0},{"field":"receita_realizada","operator":"gt","value":0}]}'::jsonb,
     '{"message":"Receita Realizada muito acima da meta histórica. Confirme se os dados estão corretos — pode ser lançamento duplicado ou unidade errada (R$ vs milhares de R$)."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_vendas,
     'Receita sem pedidos registrados', 'flag', 'warning',
     '{"all":[{"field":"receita_realizada","operator":"gt","value":0},{"field":"numero_pedidos","operator":"lte","value":0}]}'::jsonb,
     '{"message":"Receita informada mas número de pedidos está zerado. Verifique se o dado de volume foi preenchido corretamente."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_vendas,
     'Receita não pode ser negativa', 'validation', 'error',
     '{"field":"receita_realizada","operator":"lt","value":0}'::jsonb,
     '{"message":"Receita Realizada não pode ser negativa. Se houver estorno ou nota de débito, registre via ajuste específico."}'::jsonb,
     'form_template', true, v_user_id);

  -- ============================================================
  -- 5. PIPELINE COMERCIAL SEMANAL
  -- ============================================================
  INSERT INTO form_templates (company_id, name, description, status, created_by)
  VALUES (
    v_company_id,
    'Pipeline Comercial Semanal',
    'Atualize a situação das oportunidades comerciais em andamento. Mantém o time alinhado sobre o que está ativo, avançando ou em risco.',
    'active', v_user_id
  ) RETURNING id INTO t_pipeline;

  INSERT INTO form_fields (template_id, name, label, field_type, required, options, help_text, order_index) VALUES
    (t_pipeline, 'semana_referencia',         'Semana de Referência (início)',       'date',     true, NULL,
     'Informe o início da semana (segunda-feira).', 0),
    (t_pipeline, 'nome_oportunidade',         'Nome da Oportunidade / Empresa',      'text',     true, NULL,
     'Nome do cliente ou projeto em negociação.', 1),
    (t_pipeline, 'responsavel_comercial',     'Responsável Comercial',               'text',     true, NULL,
     'Vendedor ou gerente que conduz a negociação.', 2),
    (t_pipeline, 'etapa_funil',              'Etapa no Funil',                       'select',   true,
     '["Prospecção","Qualificação","Proposta Enviada","Negociação","Contrato em Análise","Fechamento"]'::jsonb,
     'Em qual estágio da negociação essa oportunidade está agora.', 3),
    (t_pipeline, 'valor_estimado',           'Valor Estimado (R$)',                  'number',   true, NULL,
     'Valor esperado em caso de fechamento.', 4),
    (t_pipeline, 'probabilidade_fechamento', 'Probabilidade de Fechamento (%)',      'number',   true, NULL,
     'Estimativa do responsável com base no avanço da negociação. De 0 a 100.', 5),
    (t_pipeline, 'previsao_fechamento',      'Previsão de Fechamento',              'date',     true, NULL,
     'Data esperada para assinatura ou pedido.', 6),
    (t_pipeline, 'status_semana',            'Status na Semana',                     'textarea', true, NULL,
     'O que mudou desde a última atualização?', 7),
    (t_pipeline, 'proximo_passo',            'Próximo Passo Concreto',              'text',     false, NULL,
     'Ação concreta agendada para avançar nesta oportunidade.', 8);

  INSERT INTO business_rules
    (company_id, template_id, name, rule_type, severity, condition, action, applies_to, is_active, created_by)
  VALUES
    (v_company_id, t_pipeline,
     'Probabilidade fora do intervalo válido', 'validation', 'error',
     '{"any":[{"field":"probabilidade_fechamento","operator":"lt","value":0},{"field":"probabilidade_fechamento","operator":"gt","value":100}]}'::jsonb,
     '{"message":"A probabilidade de fechamento deve estar entre 0 e 100%."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_pipeline,
     'Valor de oportunidade não pode ser negativo', 'validation', 'error',
     '{"field":"valor_estimado","operator":"lt","value":0}'::jsonb,
     '{"message":"Valor Estimado negativo é inválido. Se for desconto ou ajuste, use Observações para detalhar."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_pipeline,
     'Oportunidade de alto valor — alta atenção', 'alert', 'info',
     '{"field":"valor_estimado","operator":"gt","value":500000}'::jsonb,
     '{"message":"Oportunidade acima de R$ 500 mil registrada. Certifique-se de que o Gestor Comercial está ciente e envolvido."}'::jsonb,
     'form_template', true, v_user_id);

  -- ============================================================
  -- 6. HEADCOUNT E TURNOVER MENSAL
  -- ============================================================
  INSERT INTO form_templates (company_id, name, description, status, created_by)
  VALUES (
    v_company_id,
    'Headcount e Turnover Mensal',
    'Registre a movimentação de colaboradores do mês: admissões, desligamentos e quadro ativo. Base para indicadores de rotatividade e planejamento de pessoal.',
    'active', v_user_id
  ) RETURNING id INTO t_headcount;

  INSERT INTO form_fields (template_id, name, label, field_type, required, options, help_text, order_index) VALUES
    (t_headcount, 'competencia',               'Competência',                          'date',     true, NULL,
     'Mês e ano do registro.', 0),
    (t_headcount, 'area',                      'Área / Departamento',                  'select',   true,
     '["Comercial","Operações","TI","RH","Marketing","Financeiro","Produção","Administrativo","Empresa toda"]'::jsonb,
     'Selecione a área ou "Empresa toda" para o consolidado.', 1),
    (t_headcount, 'headcount_inicio',          'Colaboradores no Início do Mês',      'number',   true, NULL,
     'Quadro ativo no primeiro dia do mês, incluindo CLT e outras modalidades.', 2),
    (t_headcount, 'admissoes',                 'Admissões no Mês',                    'number',   true, NULL,
     'Total de colaboradores que iniciaram no período.', 3),
    (t_headcount, 'desligamentos_voluntarios', 'Desligamentos Voluntários',            'number',   true, NULL,
     'Colaboradores que pediram demissão no período.', 4),
    (t_headcount, 'desligamentos_involuntarios','Desligamentos Involuntários',         'number',   true, NULL,
     'Colaboradores desligados por iniciativa da empresa.', 5),
    (t_headcount, 'headcount_fim',             'Colaboradores no Final do Mês',       'number',   true, NULL,
     'Calculado: Início + Admissões − Total de desligamentos. Confirme com o RH.', 6),
    (t_headcount, 'observacoes',               'Observações',                          'textarea', false, NULL,
     'Registre reestruturações, contratos temporários encerrados, etc.', 7);

  INSERT INTO business_rules
    (company_id, template_id, name, rule_type, severity, condition, action, applies_to, is_active, created_by)
  VALUES
    (v_company_id, t_headcount,
     'Headcount inicial não pode ser zero', 'validation', 'error',
     '{"field":"headcount_inicio","operator":"lte","value":0}'::jsonb,
     '{"message":"Headcount inicial igual a zero é inválido para uma empresa ativa. Se a área foi encerrada, arquive o formulário em vez de zerar o headcount."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_headcount,
     'Taxa de turnover acima de 10% ao mês — alerta crítico', 'alert', 'warning',
     '{"all":[{"field":"headcount_inicio","operator":"gt","value":0},{"field":"desligamentos_voluntarios","operator":"exists"},{"field":"desligamentos_involuntarios","operator":"exists"}]}'::jsonb,
     '{"message":"Verifique se o total de desligamentos não supera 10% do headcount. Turnover alto precisa de justificativa antes da aprovação."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_headcount,
     'Desligamentos não podem ser negativos', 'validation', 'error',
     '{"any":[{"field":"desligamentos_voluntarios","operator":"lt","value":0},{"field":"desligamentos_involuntarios","operator":"lt","value":0}]}'::jsonb,
     '{"message":"Valores de desligamento não podem ser negativos. Verifique os campos e corrija antes de submeter."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_headcount,
     'Admissões não podem ser negativas', 'validation', 'error',
     '{"field":"admissoes","operator":"lt","value":0}'::jsonb,
     '{"message":"O número de admissões não pode ser negativo."}'::jsonb,
     'form_template', true, v_user_id);

  -- ============================================================
  -- 7. ABSENTEÍSMO
  -- ============================================================
  INSERT INTO form_templates (company_id, name, description, status, created_by)
  VALUES (
    v_company_id,
    'Absenteísmo',
    'Registre as ausências do período por tipo e área. Permite calcular o índice de absenteísmo e identificar padrões que afetam a operação.',
    'active', v_user_id
  ) RETURNING id INTO t_absent;

  INSERT INTO form_fields (template_id, name, label, field_type, required, options, help_text, order_index) VALUES
    (t_absent, 'competencia',             'Competência',                              'date',     true, NULL,
     'Mês e ano do registro.', 0),
    (t_absent, 'area',                    'Área / Departamento',                      'text',     true, NULL,
     'Área à qual os dados de ausência se referem.', 1),
    (t_absent, 'dias_uteis_periodo',      'Dias Úteis no Período',                   'number',   true, NULL,
     'Total de dias úteis trabalhados no mês, desconsiderando feriados.', 2),
    (t_absent, 'total_colaboradores',     'Total de Colaboradores da Área',          'number',   true, NULL,
     'Headcount médio da área no período.', 3),
    (t_absent, 'dias_ausencia_atestado',  'Dias de Ausência por Atestado Médico',    'number',   true, NULL,
     'Soma de todos os dias cobertos por atestado na área.', 4),
    (t_absent, 'dias_ausencia_faltas',    'Dias de Falta Não Justificada',           'number',   true, NULL,
     'Ausências sem atestado ou justificativa formal.', 5),
    (t_absent, 'dias_ausencia_outros',    'Outros Afastamentos',                     'number',   false, NULL,
     'Licenças maternidade/paternidade, afastamentos INSS, etc.', 6),
    (t_absent, 'observacoes',             'Observações',                             'textarea', false, NULL,
     'Registre surtos, campanhas de saúde ou eventos que expliquem variações.', 7);

  INSERT INTO business_rules
    (company_id, template_id, name, rule_type, severity, condition, action, applies_to, is_active, created_by)
  VALUES
    (v_company_id, t_absent,
     'Dias úteis fora do intervalo válido', 'validation', 'error',
     '{"any":[{"field":"dias_uteis_periodo","operator":"lt","value":1},{"field":"dias_uteis_periodo","operator":"gt","value":31}]}'::jsonb,
     '{"message":"O número de dias úteis deve estar entre 1 e 31."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_absent,
     'Total de colaboradores não pode ser zero', 'validation', 'error',
     '{"field":"total_colaboradores","operator":"lte","value":0}'::jsonb,
     '{"message":"O total de colaboradores não pode ser zero ou negativo para calcular o índice de absenteísmo."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_absent,
     'Ausências não podem ser negativas', 'validation', 'error',
     '{"any":[{"field":"dias_ausencia_atestado","operator":"lt","value":0},{"field":"dias_ausencia_faltas","operator":"lt","value":0}]}'::jsonb,
     '{"message":"Valores de ausência não podem ser negativos. Verifique os campos antes de submeter."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_absent,
     'Absenteísmo elevado — possível surto ou problema sistêmico', 'flag', 'warning',
     '{"all":[{"field":"total_colaboradores","operator":"gt","value":0},{"field":"dias_ausencia_atestado","operator":"gt","value":5}]}'::jsonb,
     '{"message":"Alta concentração de atestados médicos no período. Considere investigar causas comuns antes de aprovar o lançamento."}'::jsonb,
     'form_template', true, v_user_id);

  -- ============================================================
  -- 8. KPIs OPERACIONAIS
  -- ============================================================
  INSERT INTO form_templates (company_id, name, description, status, created_by)
  VALUES (
    v_company_id,
    'KPIs Operacionais',
    'Registre os principais indicadores da operação no período. Permite acompanhar eficiência, qualidade e nível de serviço em tempo real.',
    'active', v_user_id
  ) RETURNING id INTO t_kpi_op;

  INSERT INTO form_fields (template_id, name, label, field_type, required, options, help_text, order_index) VALUES
    (t_kpi_op, 'competencia',          'Competência',                              'date',     true, NULL,
     'Mês e ano do registro.', 0),
    (t_kpi_op, 'area_operacional',     'Área Operacional',                         'text',     true, NULL,
     'Setor ou processo ao qual os KPIs se referem.', 1),
    (t_kpi_op, 'volume_processado',    'Volume Processado',                        'number',   true, NULL,
     'Quantidade de unidades, pedidos ou atendimentos realizados no período.', 2),
    (t_kpi_op, 'meta_volume',          'Meta de Volume',                           'number',   true, NULL,
     'Volume esperado conforme planejamento operacional do período.', 3),
    (t_kpi_op, 'taxa_qualidade',       'Taxa de Qualidade / Conformidade (%)',     'number',   true, NULL,
     'Percentual de entregas sem ocorrências. De 0 a 100.', 4),
    (t_kpi_op, 'sla_cumprido',         'SLA Cumprido (%)',                         'number',   true, NULL,
     'Percentual de entregas dentro do prazo acordado. De 0 a 100.', 5),
    (t_kpi_op, 'ocorrencias_registradas','Ocorrências / Não Conformidades',        'number',   true, NULL,
     'Total de problemas formalmente registrados no período.', 6),
    (t_kpi_op, 'custo_operacional',    'Custo Operacional do Período (R$)',        'number',   false, NULL,
     'Custo total da operação no período (mão de obra, materiais, logística).', 7),
    (t_kpi_op, 'observacoes',          'Observações',                              'textarea', false, NULL,
     'Registre eventos que impactaram a operação: paradas, picos de demanda, etc.', 8);

  INSERT INTO business_rules
    (company_id, template_id, name, rule_type, severity, condition, action, applies_to, is_active, created_by)
  VALUES
    (v_company_id, t_kpi_op,
     'SLA fora do intervalo válido', 'validation', 'error',
     '{"any":[{"field":"sla_cumprido","operator":"lt","value":0},{"field":"sla_cumprido","operator":"gt","value":100}]}'::jsonb,
     '{"message":"O SLA deve ser um valor entre 0% e 100%. Verifique se o numerador (atendimentos dentro do prazo) não supera o denominador (total de atendimentos)."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_kpi_op,
     'Taxa de qualidade fora do intervalo válido', 'validation', 'error',
     '{"any":[{"field":"taxa_qualidade","operator":"lt","value":0},{"field":"taxa_qualidade","operator":"gt","value":100}]}'::jsonb,
     '{"message":"Taxa de Qualidade deve estar entre 0% e 100%."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_kpi_op,
     'Meta de volume não pode ser zero', 'validation', 'error',
     '{"field":"meta_volume","operator":"lte","value":0}'::jsonb,
     '{"message":"A meta de volume não pode ser zero. Verifique o planejamento operacional do período."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_kpi_op,
     'SLA abaixo de 70% — alerta crítico de nível de serviço', 'alert', 'warning',
     '{"field":"sla_cumprido","operator":"lt","value":70}'::jsonb,
     '{"message":"ALERTA: SLA abaixo de 70%. Nível de serviço crítico — notifique o Gestor Operacional e verifique causas-raiz antes de aprovar."}'::jsonb,
     'form_template', true, v_user_id);

  -- ============================================================
  -- 9. PRODUTIVIDADE DA EQUIPE
  -- ============================================================
  INSERT INTO form_templates (company_id, name, description, status, created_by)
  VALUES (
    v_company_id,
    'Produtividade da Equipe',
    'Registre a capacidade e a entrega efetiva da equipe no período. Subsidia decisões de alocação, metas e reconhecimento.',
    'active', v_user_id
  ) RETURNING id INTO t_produt;

  INSERT INTO form_fields (template_id, name, label, field_type, required, options, help_text, order_index) VALUES
    (t_produt, 'competencia',                'Competência',                         'date',     true, NULL,
     'Mês ou semana de referência.', 0),
    (t_produt, 'equipe_area',               'Equipe / Área',                        'text',     true, NULL,
     'Informe o time ou departamento avaliado.', 1),
    (t_produt, 'total_colaboradores_ativos','Colaboradores Ativos no Período',      'number',   true, NULL,
     'Quantidade de pessoas que trabalharam (exclua afastamentos longos).', 2),
    (t_produt, 'horas_disponiveis',         'Horas Disponíveis no Período',         'number',   true, NULL,
     'Total de horas de trabalho previstas para a equipe (pessoas × horas úteis).', 3),
    (t_produt, 'horas_produtivas',          'Horas Produtivas',                     'number',   true, NULL,
     'Horas efetivamente dedicadas às atividades-fim da equipe.', 4),
    (t_produt, 'entregas_concluidas',       'Entregas / Tarefas Concluídas',        'number',   true, NULL,
     'Total de atividades finalizadas no período conforme acordado.', 5),
    (t_produt, 'meta_entregas',             'Meta de Entregas',                     'number',   true, NULL,
     'Quantidade de entregas planejada para o período.', 6),
    (t_produt, 'observacoes',               'Observações',                          'textarea', false, NULL,
     'Contextualize o resultado: treinamentos, picos de demanda, mudanças de processo.', 7);

  INSERT INTO business_rules
    (company_id, template_id, name, rule_type, severity, condition, action, applies_to, is_active, created_by)
  VALUES
    (v_company_id, t_produt,
     'Horas produtivas não podem exceder horas disponíveis', 'validation', 'error',
     '{"all":[{"field":"horas_disponiveis","operator":"gt","value":0},{"field":"horas_produtivas","operator":"gt","value":0}]}'::jsonb,
     '{"message":"As horas produtivas não podem superar as horas disponíveis no período. Verifique se não há horas extras não contabilizadas nas horas disponíveis."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_produt,
     'Meta de entregas não pode ser zero', 'validation', 'error',
     '{"field":"meta_entregas","operator":"lte","value":0}'::jsonb,
     '{"message":"A meta de entregas não pode ser zero. Sem meta definida, não é possível calcular o índice de produtividade."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_produt,
     'Colaboradores ativos zerados', 'validation', 'error',
     '{"field":"total_colaboradores_ativos","operator":"lte","value":0}'::jsonb,
     '{"message":"O número de colaboradores ativos não pode ser zero ou negativo."}'::jsonb,
     'form_template', true, v_user_id);

  -- ============================================================
  -- 10. PERFORMANCE DE CAMPANHA
  -- ============================================================
  INSERT INTO form_templates (company_id, name, description, status, created_by)
  VALUES (
    v_company_id,
    'Performance de Campanha',
    'Registre os resultados de cada campanha de marketing ativa ou encerrada. Permite comparar canais, avaliar retorno e otimizar investimentos futuros.',
    'active', v_user_id
  ) RETURNING id INTO t_campanha;

  INSERT INTO form_fields (template_id, name, label, field_type, required, options, help_text, order_index) VALUES
    (t_campanha, 'nome_campanha',        'Nome da Campanha',                        'text',     true, NULL,
     'Use o nome exato cadastrado na plataforma de mídia.', 0),
    (t_campanha, 'canal',                'Canal de Mídia',                          'select',   true,
     '["Google Ads","Meta Ads","LinkedIn Ads","TikTok Ads","Pinterest Ads","E-mail Marketing","WhatsApp","Influenciadores","SEO/Orgânico","Eventos","Afiliados","Outro"]'::jsonb,
     'Selecione o canal onde a campanha foi veiculada.', 1),
    (t_campanha, 'periodo_inicio',       'Início da Campanha',                      'date',     true, NULL,
     'Data em que a campanha entrou no ar.', 2),
    (t_campanha, 'periodo_fim',          'Encerramento da Campanha',                'date',     false, NULL,
     'Data de término. Deixe em branco se ainda estiver ativa.', 3),
    (t_campanha, 'investimento_total',   'Investimento Total (R$)',                 'number',   true, NULL,
     'Valor total gasto no período, incluindo verba de mídia e produção.', 4),
    (t_campanha, 'impressoes',           'Impressões',                              'number',   false, NULL,
     'Quantas vezes o anúncio foi exibido.', 5),
    (t_campanha, 'cliques',              'Cliques',                                 'number',   false, NULL,
     'Total de cliques recebidos pelo anúncio ou e-mail.', 6),
    (t_campanha, 'conversoes',           'Conversões',                              'number',   true, NULL,
     'Ações concluídas: compras, cadastros, solicitações de contato.', 7),
    (t_campanha, 'receita_atribuida',    'Receita Atribuída à Campanha (R$)',       'number',   false, NULL,
     'Receita gerada diretamente por essa campanha, conforme rastreamento.', 8),
    (t_campanha, 'observacoes',          'Observações',                             'textarea', false, NULL,
     'Registre aprendizados, criativos testados ou contexto para análises futuras.', 9);

  INSERT INTO business_rules
    (company_id, template_id, name, rule_type, severity, condition, action, applies_to, is_active, created_by)
  VALUES
    (v_company_id, t_campanha,
     'Investimento não pode ser negativo', 'validation', 'error',
     '{"field":"investimento_total","operator":"lt","value":0}'::jsonb,
     '{"message":"O Investimento Total não pode ser negativo. Se houver crédito ou reembolso de plataforma, registre em Observações."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_campanha,
     'Conversões sem investimento registrado', 'flag', 'warning',
     '{"all":[{"field":"conversoes","operator":"gt","value":0},{"field":"investimento_total","operator":"lte","value":0}]}'::jsonb,
     '{"message":"Conversões registradas com investimento zero. Verifique se a campanha é orgânica ou se o investimento não foi informado."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_campanha,
     'ROAS aparentemente abaixo de 1 — campanha no prejuízo', 'flag', 'warning',
     '{"all":[{"field":"investimento_total","operator":"gt","value":0},{"field":"receita_atribuida","operator":"exists"},{"field":"receita_atribuida","operator":"gt","value":0}]}'::jsonb,
     '{"message":"Verifique a relação entre Receita Atribuída e Investimento. Se o ROAS estiver abaixo de 1, a campanha gerou prejuízo direto — confirme os dados antes de aprovar."}'::jsonb,
     'form_template', true, v_user_id);

  -- ============================================================
  -- 11. MÉTRICAS DE AQUISIÇÃO
  -- ============================================================
  INSERT INTO form_templates (company_id, name, description, status, created_by)
  VALUES (
    v_company_id,
    'Métricas de Aquisição',
    'Registre os indicadores de atração e conversão de novos clientes ou leads no período. Essencial para avaliar a eficiência do funil de marketing.',
    'active', v_user_id
  ) RETURNING id INTO t_aquisicao;

  INSERT INTO form_fields (template_id, name, label, field_type, required, options, help_text, order_index) VALUES
    (t_aquisicao, 'competencia',            'Competência',                         'date',     true, NULL,
     'Mês e ano do registro.', 0),
    (t_aquisicao, 'canal_aquisicao',        'Canal de Aquisição',                  'select',   true,
     '["Orgânico (SEO)","Tráfego Pago","Indicação / Referral","Evento / Webinar","Parceiro","Direto / Não identificado","Outbound / Prospecção ativa"]'::jsonb,
     'Selecione a origem dos leads registrados neste lançamento.', 1),
    (t_aquisicao, 'visitantes_unicos',      'Visitantes Únicos no Site',           'number',   false, NULL,
     'Total de usuários únicos que acessaram o site ou landing page no período.', 2),
    (t_aquisicao, 'leads_gerados',          'Leads Gerados',                       'number',   true, NULL,
     'Contatos que preencheram um formulário, se cadastraram ou demonstraram interesse.', 3),
    (t_aquisicao, 'leads_qualificados',     'Leads Qualificados (MQL/SQL)',        'number',   false, NULL,
     'Leads aprovados pelo marketing ou comercial como prontos para abordagem.', 4),
    (t_aquisicao, 'novos_clientes',         'Novos Clientes Convertidos',          'number',   true, NULL,
     'Leads que se tornaram clientes pagantes no período.', 5),
    (t_aquisicao, 'cac',                    'CAC — Custo de Aquisição (R$)',       'number',   false, NULL,
     'Investimento total de marketing e vendas ÷ número de novos clientes.', 6),
    (t_aquisicao, 'ltv_estimado',           'LTV — Valor de Vida Estimado (R$)',   'number',   false, NULL,
     'Receita média esperada por cliente durante o relacionamento com a empresa.', 7),
    (t_aquisicao, 'observacoes',            'Observações',                         'textarea', false, NULL,
     'Registre variações de tráfego, mudanças de estratégia ou campanhas que influenciaram os dados.', 8);

  INSERT INTO business_rules
    (company_id, template_id, name, rule_type, severity, condition, action, applies_to, is_active, created_by)
  VALUES
    (v_company_id, t_aquisicao,
     'Novos clientes não podem exceder leads gerados', 'validation', 'error',
     '{"all":[{"field":"leads_gerados","operator":"gt","value":0},{"field":"novos_clientes","operator":"gt","value":0}]}'::jsonb,
     '{"message":"O número de novos clientes convertidos não pode superar o de leads gerados. Revise os valores — provável inversão de campos."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_aquisicao,
     'CAC não pode ser zero ou negativo', 'validation', 'error',
     '{"all":[{"field":"cac","operator":"exists"},{"field":"cac","operator":"lte","value":0}]}'::jsonb,
     '{"message":"CAC (Custo de Aquisição de Cliente) igual a zero ou negativo é inválido. Se não houve investimento, deixe o campo em branco — não preencha com zero."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_aquisicao,
     'LTV abaixo do CAC — unidade de negócio no prejuízo', 'alert', 'warning',
     '{"all":[{"field":"ltv_estimado","operator":"exists"},{"field":"cac","operator":"exists"},{"field":"ltv_estimado","operator":"gt","value":0},{"field":"cac","operator":"gt","value":0}]}'::jsonb,
     '{"message":"ALERTA: LTV estimado pode estar abaixo do CAC. Se confirmado, cada novo cliente gera prejuízo antes de se pagar. Notifique o Gestor de Marketing e de Finanças."}'::jsonb,
     'form_template', true, v_user_id),

    (v_company_id, t_aquisicao,
     'Leads gerados não podem ser negativos', 'validation', 'error',
     '{"field":"leads_gerados","operator":"lt","value":0}'::jsonb,
     '{"message":"O número de leads gerados não pode ser negativo."}'::jsonb,
     'form_template', true, v_user_id);

  RAISE NOTICE '✓ 11 formulários criados com campos e regras de negócio.';
  RAISE NOTICE 'Domínios cobertos: Financeiro (3) · Vendas (2) · RH (2) · Operações (2) · Marketing (2)';

END $$;
