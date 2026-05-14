import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { BarChart3 } from 'lucide-react'
import { getDashboards } from '@/actions/dashboards'
import DashboardsClient from './DashboardsClient'

export type DashboardRow = {
  id: string
  name: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

export type TemplateStats = {
  id: string
  name: string
  total: number
  pending: number
  approved: number
  rejected: number
  flagged: number
}

export default async function AnalistaDashboardsPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const companyId = cookieStore.get('active_company_id')?.value ?? ''

  const [
    { data: dashboards },
    { data: templates },
    { data: entries },
  ] = await Promise.all([
    getDashboards(),
    supabase
      .from('form_templates')
      .select('id, name')
      .eq('company_id', companyId)
      .neq('status', 'archived'),
    supabase
      .from('data_entries')
      .select('template_id, status')
      .eq('company_id', companyId),
  ])

  // Aggregate entry stats per template
  const statsMap: Record<string, TemplateStats> = {}
  for (const t of (templates ?? []) as { id: string; name: string }[]) {
    statsMap[t.id] = { id: t.id, name: t.name, total: 0, pending: 0, approved: 0, rejected: 0, flagged: 0 }
  }
  for (const e of (entries ?? []) as { template_id: string; status: string }[]) {
    const s = statsMap[e.template_id]
    if (!s) continue
    s.total++
    if (e.status === 'pending')  s.pending++
    if (e.status === 'approved') s.approved++
    if (e.status === 'rejected') s.rejected++
    if (e.status === 'flagged')  s.flagged++
  }

  const templateStats = Object.values(statsMap).filter(s => s.total > 0).sort((a, b) => b.total - a.total)

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center border border-primary/30">
            <BarChart3 size={16} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dash<span className="text-primary">boards</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
          Painéis · Métricas · Visualizações
        </p>
      </div>

      <DashboardsClient
        dashboards={(dashboards ?? []) as DashboardRow[]}
        templateStats={templateStats}
      />
    </div>
  )
}
