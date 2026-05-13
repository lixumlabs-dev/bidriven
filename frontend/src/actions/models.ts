'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getActiveCompanyId() {
  return (await cookies()).get('active_company_id')?.value ?? null
}

export async function getDataModels(status?: 'draft' | 'active' | 'archived') {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { data: null, error: 'Nenhuma empresa ativa' }

  let query = supabase
    .from('data_models')
    .select('*')
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  return { data, error: error?.message ?? null }
}

export async function getDataModel(id: string) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { data: null, error: 'Nenhuma empresa ativa' }

  const [{ data: model, error }, { data: fields }, { data: sources }] = await Promise.all([
    supabase
      .from('data_models')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single(),
    supabase
      .from('model_fields')
      .select('*')
      .eq('model_id', id)
      .order('order_index'),
    supabase
      .from('model_sources')
      .select('*')
      .eq('model_id', id),
  ])

  if (error) return { data: null, error: error.message }
  return { data: { ...model, fields: fields ?? [], sources: sources ?? [] }, error: null }
}

export async function createDataModel(input: {
  name: string
  description?: string
}) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!companyId || !user) return { data: null, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('data_models')
    .insert({ ...input, company_id: companyId, created_by: user.id })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/app/analista/catalog')
  return { data, error: null }
}

export async function upsertModelField(modelId: string, field: {
  id?: string
  name: string
  label: string
  field_type: string
  order_index: number
  is_dimension?: boolean
  aggregation?: string
  format?: string
}) {
  const supabase = await createClient()

  if (field.id) {
    const { error } = await supabase
      .from('model_fields')
      .update({ ...field, model_id: modelId })
      .eq('id', field.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('model_fields')
      .insert({ ...field, model_id: modelId })
    if (error) return { error: error.message }
  }

  revalidatePath('/app/analista/catalog')
  return { error: null }
}

export async function addModelSource(modelId: string, source: {
  source_type: 'form_template' | 'raw_records' | 'data_model'
  source_id: string
  field_mapping?: Record<string, string>
  filters?: unknown
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('model_sources')
    .insert({ model_id: modelId, ...source })

  if (error) return { error: error.message }
  revalidatePath('/app/analista/catalog')
  return { error: null }
}

export async function publishModel(modelId: string) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { error: 'Nenhuma empresa ativa' }

  const { error } = await supabase
    .from('data_models')
    .update({ status: 'active' })
    .eq('id', modelId)
    .eq('company_id', companyId)

  if (error) return { error: error.message }
  revalidatePath('/app/analista/catalog')
  return { error: null }
}

export async function getModelRecords(modelId: string, limit = 100) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { data: null, error: 'Nenhuma empresa ativa' }

  const { data, error } = await supabase
    .from('model_records')
    .select('*')
    .eq('model_id', modelId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data, error: error?.message ?? null }
}
