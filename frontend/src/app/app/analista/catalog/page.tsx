import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Database } from 'lucide-react'
import CatalogClient from './CatalogClient'

export type CatalogField = {
  id: string
  template_id: string
  name: string
  label: string
  field_type: string
  required: boolean
  order_index: number
  options: unknown
  default_value: string | null
  help_text: string | null
}

export type CatalogTemplate = {
  id: string
  name: string
  description: string | null
  status: string
  fields: CatalogField[]
  rules_count: number
}

export default async function AnalistaCatalogPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const companyId = cookieStore.get('active_company_id')?.value ?? ''

  const [{ data: templates }, { data: allFields }, { data: rulesCounts }] = await Promise.all([
    supabase
      .from('form_templates')
      .select('id, name, description, status')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false }),

    supabase
      .from('form_fields')
      .select('*')
      .in(
        'template_id',
        // safe placeholder — will be replaced after templates load
        (await supabase.from('form_templates').select('id').eq('company_id', companyId)).data?.map(t => t.id) ?? ['00000000-0000-0000-0000-000000000000']
      )
      .order('order_index'),

    supabase
      .from('business_rules')
      .select('template_id')
      .eq('company_id', companyId)
      .eq('status', 'active'),
  ])

  const fieldsByTemplate: Record<string, CatalogField[]> = {}
  for (const f of (allFields ?? []) as CatalogField[]) {
    if (!fieldsByTemplate[f.template_id]) fieldsByTemplate[f.template_id] = []
    fieldsByTemplate[f.template_id].push(f)
  }

  const rulesCountByTemplate: Record<string, number> = {}
  for (const r of (rulesCounts ?? []) as { template_id: string }[]) {
    rulesCountByTemplate[r.template_id] = (rulesCountByTemplate[r.template_id] ?? 0) + 1
  }

  const rows: CatalogTemplate[] = ((templates ?? []) as { id: string; name: string; description: string | null; status: string }[]).map(t => ({
    ...t,
    fields: fieldsByTemplate[t.id] ?? [],
    rules_count: rulesCountByTemplate[t.id] ?? 0,
  }))

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center border border-primary/30">
            <Database size={16} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Catálogo <span className="text-primary">de Dados</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
          Templates · Campos · Regras de negócio
        </p>
      </div>

      <CatalogClient templates={rows} />
    </div>
  )
}
