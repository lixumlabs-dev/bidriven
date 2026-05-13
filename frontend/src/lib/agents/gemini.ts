import { GoogleGenAI } from '@google/genai'

export type AgentType =
  | 'build_dashboard'
  | 'apply_rules'
  | 'analyze_data'
  | 'suggest_model'
  | 'validate_entries'
  | 'generate_report'

export interface AgentContext {
  companyId: string
  userId:    string
  [key: string]: unknown
}

export interface AgentResult {
  output:      string
  tokensUsed:  number
  success:     boolean
  error?:      string
}

const SYSTEM_PROMPTS: Record<AgentType, string> = {
  build_dashboard: `Você é um especialista em visualização de dados e Business Intelligence.
Analise os dados fornecidos e sugira um layout de dashboard com os widgets mais relevantes.
Responda em JSON com a estrutura: { title, description, widgets: [{ type, title, config }] }`,

  apply_rules: `Você é um especialista em qualidade de dados.
Analise as entradas e as regras de negócio fornecidas.
Identifique violações, inconsistências e sugira correções.
Responda em JSON com: { violations: [{ field, rule, suggestion }], summary, overall_quality_score }`,

  analyze_data: `Você é um analista de dados sênior especializado em Business Intelligence.
Analise os dados fornecidos e produza insights acionáveis.
Responda em JSON com: { summary, trends: [], anomalies: [], recommendations: [], confidence }`,

  suggest_model: `Você é um engenheiro de dados especializado em modelagem dimensional.
Com base nos formulários e fontes de dados fornecidos, sugira um modelo de dados otimizado.
Responda em JSON com: { model_name, description, fields: [{ name, type, description, is_key }], sources }`,

  validate_entries: `Você é um auditor de dados.
Valide as entradas fornecidas contra as regras de negócio e padrões esperados.
Responda em JSON com: { total, passed, failed, flagged, details: [{ entry_id, status, issues }] }`,

  generate_report: `Você é um analista de business intelligence.
Com base nos dados fornecidos, gere um relatório executivo em português brasileiro.
Responda em JSON com: { title, executive_summary, sections: [{ title, content, metrics }], conclusions }`,
}

export async function runGeminiAgent(
  agentType: AgentType,
  context: AgentContext,
  userPrompt?: string
): Promise<AgentResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { output: '', tokensUsed: 0, success: false, error: 'GEMINI_API_KEY não configurado' }
  }

  const ai = new GoogleGenAI({ apiKey })

  const systemPrompt = SYSTEM_PROMPTS[agentType]
  const contextBlock = `\n\n## Contexto\n${JSON.stringify(context, null, 2)}`
  const fullPrompt = `${systemPrompt}${contextBlock}${userPrompt ? `\n\n## Instrução adicional\n${userPrompt}` : ''}`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    })

    const text = response.text ?? ''
    const tokensUsed = response.usageMetadata?.totalTokenCount ?? 0

    return { output: text, tokensUsed, success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return { output: '', tokensUsed: 0, success: false, error: message }
  }
}
