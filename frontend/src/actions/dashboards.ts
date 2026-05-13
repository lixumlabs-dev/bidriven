'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getActiveCompanyId() {
  return (await cookies()).get('active_company_id')?.value ?? null
}

export async function getDashboards(status?: 'draft' | 'published' | 'archived') {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { data: null, error: 'Nenhuma empresa ativa' }

  let query = supabase
    .from('dashboards')
    .select('*')
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  return { data, error: error?.message ?? null }
}

export async function getDashboard(id: string) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { data: null, error: 'Nenhuma empresa ativa' }

  const [{ data: dashboard, error }, { data: widgets }] = await Promise.all([
    supabase
      .from('dashboards')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single(),
    supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('dashboard_id', id),
  ])

  if (error) return { data: null, error: error.message }
  return { data: { ...dashboard, widgets: widgets ?? [] }, error: null }
}

export async function createDashboard(input: {
  name: string
  description?: string
}) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!companyId || !user) return { data: null, error: 'Não autenticado' }

  const { data, error } = await supabase
    .from('dashboards')
    .insert({ ...input, company_id: companyId, created_by: user.id })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  revalidatePath('/app/analista/dashboards')
  return { data, error: null }
}

export async function upsertWidget(dashboardId: string, widget: {
  id?: string
  widget_type: string
  title: string
  position: { x: number; y: number; w: number; h: number }
  config?: Record<string, unknown>
  model_id?: string
  query_config?: Record<string, unknown>
}) {
  const supabase = await createClient()

  if (widget.id) {
    const { error } = await supabase
      .from('dashboard_widgets')
      .update({ ...widget, dashboard_id: dashboardId })
      .eq('id', widget.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('dashboard_widgets')
      .insert({ ...widget, dashboard_id: dashboardId })
    if (error) return { error: error.message }
  }

  revalidatePath('/app/analista/dashboards')
  return { error: null }
}

export async function publishDashboard(dashboardId: string) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!companyId || !user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('dashboards')
    .update({
      status:       'published',
      published_by: user.id,
      published_at: new Date().toISOString(),
    })
    .eq('id', dashboardId)
    .eq('company_id', companyId)

  if (error) return { error: error.message }
  revalidatePath('/app/analista/dashboards')
  revalidatePath('/app/gestor/reports')
  return { error: null }
}

export async function recordDashboardView(dashboardId: string) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user } } = await supabase.auth.getUser()
  if (!companyId || !user) return

  await supabase.from('dashboard_views').insert({
    dashboard_id: dashboardId,
    company_id:   companyId,
    viewer_id:    user.id,
  })
}
