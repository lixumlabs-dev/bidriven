import { getFormTemplates } from '@/actions/forms'
import { FileText, Plus } from 'lucide-react'
import FormsClient from './FormsClient'

export type TemplateRow = {
  id: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'archived'
  updated_at: string
  created_at: string
}

export default async function AnalistaFormsPage() {
  const { data: templates } = await getFormTemplates()

  const rows: TemplateRow[] = (templates ?? []).map(t => ({
    id:          t.id,
    name:        t.name,
    description: t.description ?? null,
    status:      t.status as 'draft' | 'active' | 'archived',
    updated_at:  t.updated_at,
    created_at:  t.created_at,
  }))

  const counts = {
    draft:    rows.filter(t => t.status === 'draft').length,
    active:   rows.filter(t => t.status === 'active').length,
    archived: rows.filter(t => t.status === 'archived').length,
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-violet-400/20 rounded flex items-center justify-center border border-violet-400/30">
              <FileText size={16} className="text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Formulá<span className="text-violet-400">rios</span>
            </h1>
          </div>
          <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
            {counts.active} ativos · {counts.draft} rascunhos · {counts.archived} arquivados
          </p>
        </div>
      </div>

      <FormsClient templates={rows} />
    </div>
  )
}
