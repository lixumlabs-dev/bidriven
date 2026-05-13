'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getActiveCompanyId() {
  return (await cookies()).get('active_company_id')?.value ?? null
}

export type AgentType =
  | 'build_dashboard'
  | 'apply_rules'
  | 'analyze_data'
  | 'suggest_model'
  | 'validate_entries'
  | 'generate_report'

export async function requestAgent(
  agentType: AgentType,
  context: Record<string, unknown>,
  prompt?: string
) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!companyId || !user) return { data: null, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('agent_requests')
    .insert({
      company_id:   companyId,
      requested_by: user.id,
      agent_type:   agentType,
      context,
      prompt,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/app/analista/agents')
  return { data, error: null }
}

export async function getAgentRequests() {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!companyId || !user) return { data: null, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('agent_requests')
    .select('*, runs:agent_runs(id, status, result, started_at, finished_at)')
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
