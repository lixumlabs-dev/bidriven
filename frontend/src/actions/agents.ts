'use server'

import { createClient } from '@/lib/supabase/server'
import { runGeminiAgent, type AgentType } from '@/lib/agents/gemini'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type { AgentType }

async function getActiveCompanyId() {
  return (await cookies()).get('active_company_id')?.value ?? null
}

export async function requestAgent(
  agentType: AgentType,
  context: Record<string, unknown>,
  prompt?: string
) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!companyId || !user) return { data: null, error: 'Não autenticado' }

  // 1. Cria o request com status pending
  const { data: request, error: reqError } = await supabase
    .from('agent_requests')
    .insert({
      company_id:   companyId,
      requested_by: user.id,
      agent_type:   agentType,
      context,
      prompt,
      status:       'running',
    })
    .select()
    .single()

  if (reqError || !request) return { data: null, error: reqError?.message }

  // 2. Cria o run e executa o agente
  const startedAt = new Date().toISOString()

  const { data: run, error: runError } = await supabase
    .from('agent_runs')
    .insert({ request_id: request.id, status: 'running', started_at: startedAt })
    .select()
    .single()

  if (runError || !run) {
    await supabase.from('agent_requests').update({ status: 'failed' }).eq('id', request.id)
    return { data: null, error: runError?.message }
  }

  // 3. Executa Gemini (síncrono — Flash é rápido o suficiente)
  const result = await runGeminiAgent(
    agentType,
    { companyId, userId: user.id, ...context },
    prompt
  )

  const finishedAt = new Date().toISOString()

  if (result.success) {
    await Promise.all([
      supabase.from('agent_runs').update({
        status:      'completed',
        result:      { output: result.output },
        tokens_used: result.tokensUsed,
        finished_at: finishedAt,
      }).eq('id', run.id),

      supabase.from('agent_requests').update({ status: 'completed' }).eq('id', request.id),

      supabase.from('notifications').insert({
        company_id: companyId,
        user_id:    user.id,
        type:       'agent_completed',
        title:      'Agente concluído',
        message:    `O agente "${agentType}" finalizou com sucesso.`,
        metadata:   { request_id: request.id, run_id: run.id },
      }),
    ])
  } else {
    await Promise.all([
      supabase.from('agent_runs').update({
        status:      'failed',
        error:       result.error ?? 'Erro desconhecido',
        finished_at: finishedAt,
      }).eq('id', run.id),

      supabase.from('agent_requests').update({ status: 'failed' }).eq('id', request.id),
    ])
  }

  revalidatePath('/app/analista/agents')
  return { data: { request, run, output: result.output }, error: result.error ?? null }
}

export async function getAgentRequests() {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!companyId || !user) return { data: null, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('agent_requests')
    .select('*, runs:agent_runs(id, status, result, started_at, finished_at, tokens_used)')
    .eq('company_id', companyId)
    .eq('requested_by', user.id)
    .order('created_at', { ascending: false })

  return { data, error: error?.message ?? null }
}

export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return { data, error: error?.message ?? null }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  return { error: error?.message ?? null }
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return { error: error?.message ?? null }
}
