import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Database } from 'lucide-react'
import ReportsClient from './ReportsClient'

export type ReportEntry = {
  id: string
  template_id: string
  template_name: string
  submitter_name: string | null
  submitted_at: string
  status: string
  reviewed_at: string | null
  review_notes: string | null
}

export type ReportTemplate = {
  id: string
  name: string
}

type RawEntry = {
  id: string
  template_id: string
  submitted_at: string
  status: string
  reviewed_at: string | null
  review_notes: string | null
  template: Array<{ name: string }> | { name: string } | null
  submitter: Array<{ full_name: string | null }> | { full_name: string | null } | null
}

function templateName(t: RawEntry['template']): string {
  if (!t) return '—'
  return Array.isArray(t) ? (t[0]?.name ?? '—') : t.name
}

function submitterName(s: RawEntry['submitter']): string | null {
  if (!s) return null
  return Array.isArray(s) ? (s[0]?.full_name ?? null) : s.full_name
}

export default async function GestorReportsPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const companyId = cookieStore.get('active_company_id')?.value ?? ''

  const [{ data: rawEntries }, { data: templates }] = await Promise.all([
    supabase
      .from('data_entries')
      .select(`
        id, template_id, submitted_at, status, reviewed_at, review_notes,
        template:form_templates(name),
        submitter:profiles(full_name)
      `)
      .eq('company_id', companyId)
      .order('submitted_at', { ascending: false })
      .limit(200),

    supabase
      .from('form_templates')
      .select('id, name')
      .eq('company_id', companyId)
      .neq('status', 'archived'),
  ])

  const entries: ReportEntry[] = ((rawEntries as unknown as RawEntry[]) ?? []).map(e => ({
    id:             e.id,
    template_id:    e.template_id,
    template_name:  templateName(e.template),
    submitter_name: submitterName(e.submitter),
    submitted_at:   e.submitted_at,
    status:         e.status,
    reviewed_at:    e.reviewed_at,
    review_notes:   e.review_notes,
  }))

  const reportTemplates: ReportTemplate[] = ((templates ?? []) as { id: string; name: string }[])

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center border border-primary/30">
            <Database size={16} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Relatórios <span className="text-primary">Executivos</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
          Histórico de entradas · Análise por formulário
        </p>
      </div>

      <ReportsClient entries={entries} templates={reportTemplates} />
    </div>
  )
}
