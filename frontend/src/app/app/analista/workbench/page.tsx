import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getPendingCount } from '@/actions/entries'
import { GitBranch, CheckCircle2, Bot, Clock } from 'lucide-react'
import WorkbenchClient from './WorkbenchClient'

export type EntryRow = {
  id: string
  template_id: string
  values: Record<string, unknown>
  submitted_by: string
  submitted_at: string
  status: string
  template_name: string
  submitter_name: string | null
}

export default async function AnalistaWorkbenchPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const companyId = cookieStore.get('active_company_id')?.value ?? ''

  const [
    { count: pendingCount },
    { data: entries },
    { count: approvedToday },
  ] = await Promise.all([
    getPendingCount(),

    supabase
      .from('data_entries')
      .select(`
        id, template_id, values, submitted_by, submitted_at, status,
        template:form_templates!inner(name),
        submitter:profiles(full_name)
      `)
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true }),

    supabase
      .from('data_entries')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .gte('reviewed_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ])

  const stats = [
    { label: 'Na Fila',         value: pendingCount,       icon: Clock,       color: 'text-yellow-400'  },
    { label: 'Aprovados Hoje',  value: approvedToday ?? 0, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Agentes Ativos',  value: 0,                  icon: Bot,         color: 'text-primary'     },
  ]

  type RawEntry = {
    id: string
    template_id: string
    values: Record<string, unknown>
    submitted_by: string
    submitted_at: string
    status: string
    template: Array<{ name: string }> | { name: string } | null
    submitter: Array<{ full_name: string | null }> | { full_name: string | null } | null
  }

  function firstName(t: RawEntry['template']): string {
    if (!t) return '—'
    return Array.isArray(t) ? (t[0]?.name ?? '—') : t.name
  }
  function submitterName(s: RawEntry['submitter']): string | null {
    if (!s) return null
    return Array.isArray(s) ? (s[0]?.full_name ?? null) : s.full_name
  }

  const rows: EntryRow[] = ((entries as unknown as RawEntry[]) ?? []).map(e => ({
    id:             e.id,
    template_id:    e.template_id,
    values:         e.values ?? {},
    submitted_by:   e.submitted_by,
    submitted_at:   e.submitted_at,
    status:         e.status,
    template_name:  firstName(e.template),
    submitter_name: submitterName(e.submitter),
  }))

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-violet-400/20 rounded flex items-center justify-center border border-violet-400/30">
            <GitBranch size={16} className="text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Work<span className="text-violet-400">bench</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
          Fila de revisão · Valide as entradas dos Operadores
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="glass-panel p-5 relative overflow-hidden group">
            <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-[0.07] transition-opacity">
              <s.icon size={56} />
            </div>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-3">{s.label}</p>
            <h3 className={`text-4xl font-bold tabular-nums ${s.color}`}>{s.value}</h3>
          </div>
        ))}
      </div>

      <WorkbenchClient entries={rows} />
    </div>
  )
}
