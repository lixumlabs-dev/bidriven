'use server'

import { createClient } from '@/lib/supabase/server'
import { runRulesForEntry } from '@/lib/rules-engine'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getActiveCompanyId() {
  return (await cookies()).get('active_company_id')?.value ?? null
}

export async function getEntries(filters?: {
  templateId?: string
  status?: 'pending' | 'approved' | 'rejected' | 'flagged'
  submittedBy?: string
}) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { data: null, error: 'Nenhuma empresa ativa' }

  let query = supabase
    .from('data_entries')
    .select('*')
    .eq('company_id', companyId)
    .order('submitted_at', { ascending: false })

  if (filters?.templateId) query = query.eq('template_id', filters.templateId)
  if (filters?.status)     query = query.eq('status', filters.status)
  if (filters?.submittedBy) query = query.eq('submitted_by', filters.submittedBy)

  const { data, error } = await query
  return { data, error: error?.message ?? null }
}

export async function submitEntry(templateId: string, values: Record<string, unknown>) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!companyId || !user) return { data: null, error: 'Não autenticado' }

  const { data: template } = await supabase
    .from('form_templates')
    .select('id, status')
    .eq('id', templateId)
    .eq('company_id', companyId)
    .eq('status', 'active')
    .single()

  if (!template) return { data: null, error: 'Formulário não encontrado ou inativo' }

  const { data, error } = await supabase
    .from('data_entries')
    .insert({
      company_id:   companyId,
      template_id:  templateId,
      values,
      submitted_by: user.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Avalia regras de negócio em background — não bloqueia o retorno
  runRulesForEntry(supabase, companyId, templateId, data.id, values).catch(() => undefined)

  revalidatePath('/app/operador/lancamentos')
  return { data, error: null }
}

export async function reviewEntry(
  entryId: string,
  decision: 'approved' | 'rejected' | 'flagged',
  notes?: string
) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!companyId || !user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('data_entries')
    .update({
      status:       decision,
      reviewed_by:  user.id,
      reviewed_at:  new Date().toISOString(),
      review_notes: notes ?? null,
    })
    .eq('id', entryId)
    .eq('company_id', companyId)

  if (error) return { error: error.message }
  revalidatePath('/app/analista/workbench')
  return { error: null }
}

export async function getEntryWithValidations(entryId: string) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { data: null, error: 'Nenhuma empresa ativa' }

  const [{ data: entry, error }, { data: validations }] = await Promise.all([
    supabase
      .from('data_entries')
      .select('*')
      .eq('id', entryId)
      .eq('company_id', companyId)
      .single(),
    supabase
      .from('rule_validations')
      .select('*, rule:business_rules(name, severity, rule_type)')
      .eq('entry_id', entryId),
  ])

  if (error) return { data: null, error: error.message }
  return { data: { ...entry, validations: validations ?? [] }, error: null }
}

export async function getPendingCount() {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { count: 0 }

  const { count } = await supabase
    .from('data_entries')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'pending')

  return { count: count ?? 0 }
}
