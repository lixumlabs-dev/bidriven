import { getFormTemplates } from '@/actions/forms'
import { ClipboardList } from 'lucide-react'
import LaunchClient from './LaunchClient'

export type TemplateCard = {
  id: string
  name: string
  description: string | null
}

export default async function OperadorLancamentosPage() {
  const { data: templates } = await getFormTemplates('active')

  const cards: TemplateCard[] = (templates ?? []).map(t => ({
    id:          t.id,
    name:        t.name,
    description: t.description ?? null,
  }))

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-emerald-400/20 rounded flex items-center justify-center border border-emerald-400/30">
            <ClipboardList size={16} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Lança<span className="text-emerald-400">mentos</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
          {cards.length} formulário{cards.length !== 1 ? 's' : ''} disponív{cards.length !== 1 ? 'eis' : 'el'} para preenchimento
        </p>
      </div>

      <LaunchClient templates={cards} />
    </div>
  )
}
