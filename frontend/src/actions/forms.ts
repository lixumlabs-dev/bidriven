'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getActiveCompanyId() {
  return (await cookies()).get('active_company_id')?.value ?? null
}

// ─── FORM TEMPLATES ──────────────────────────────────────

export async function getFormTemplates(status?: 'draft' | 'active' | 'archived') {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { data: null, error: 'Nenhuma empresa ativa' }

  let query = supabase
    .from('form_templates')
    .select('*')
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  return { data, error: error?.message ?? null }
}

export async function getFormTemplate(id: string) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { data: null, error: 'Nenhuma empresa ativa' }

  const [{ data: template, error }, { data: fields }] = await Promise.all([
    supabase
      .from('form_templates')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single(),
    supabase
      .from('form_fields')
      .select('*')
      .eq('template_id', id)
      .order('order_index'),
  ])

  if (error) return { data: null, error: error.message }
  return { data: { ...template, fields: fields ?? [] }, error: null }
}

export async function createFormTemplate(input: {
  name: string
  description?: string
}) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!companyId || !user) return { data: null, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('form_templates')
    .insert({ ...input, company_id: companyId, created_by: user.id })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/app/analista/catalog')
  return { data, error: null }
}

export async function updateFormTemplate(id: string, input: {
  name?: string
  description?: string
  status?: 'draft' | 'active' | 'archived'
}) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { error: 'Nenhuma empresa ativa' }

  const { error } = await supabase
    .from('form_templates')
    .update(input)
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return { error: error.message }
  revalidatePath('/app/analista/catalog')
  return { error: null }
}

// ─── FORM FIELDS ──────────────────────────────────────────

export async function upsertFormField(templateId: string, field: {
  id?: string
  name: string
  label: string
  field_type: string
  required?: boolean
  order_index: number
  options?: unknown
  validations?: unknown
  default_value?: string
  help_text?: string
}) {
  const supabase = await createClient()

  if (field.id) {
    const { error } = await supabase
      .from('form_fields')
      .update({ ...field, template_id: templateId })
      .eq('id', field.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('form_fields')
      .insert({ ...field, template_id: templateId })
    if (error) return { error: error.message }
  }

  revalidatePath('/app/analista/catalog')
  return { error: null }
}

export async function deleteFormField(fieldId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('form_fields')
    .delete()
    .eq('id', fieldId)

  if (error) return { error: error.message }
  revalidatePath('/app/analista/catalog')
  return { error: null }
}

export async function reorderFormFields(templateId: string, orderedIds: string[]) {
  const supabase = await createClient()

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('form_fields')
      .update({ order_index: index })
      .eq('id', id)
      .eq('template_id', templateId)
  )

  await Promise.all(updates)
  revalidatePath('/app/analista/catalog')
  return { error: null }
}
