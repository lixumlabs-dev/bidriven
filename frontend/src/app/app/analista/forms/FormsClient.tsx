'use client'

import { useState, useTransition } from 'react'
import { createFormTemplate, updateFormTemplate } from '@/actions/forms'
import { useRouter } from 'next/navigation'
import {
  Plus, FileText, Loader2, CheckCircle2, XCircle,
  ToggleLeft, ToggleRight, Archive, ChevronRight,
} from 'lucide-react'
import type { TemplateRow } from './page'

const STATUS_BADGE: Record<string, string> = {
  draft:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  active:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  archived: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
}

const STATUS_LABEL: Record<string, string> = {
  draft:    'Rascunho',
  active:   'Ativo',
  archived: 'Arquivado',
}

export default function FormsClient({ templates }: { templates: TemplateRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      const { error } = await createFormTemplate({ name: name.trim(), description: description.trim() || undefined })
      if (error) {
        setFeedback({ type: 'error', msg: error })
      } else {
        setFeedback({ type: 'ok', msg: `Formulário "${name}" criado como rascunho` })
        setName('')
        setDescription('')
        setShowCreate(false)
        router.refresh()
      }
    })
  }

  function handleToggleStatus(id: string, current: string) {
    const next = current === 'draft' ? 'active' : current === 'active' ? 'archived' : 'draft'
    startTransition(async () => {
      const { error } = await updateFormTemplate(id, { status: next as 'draft' | 'active' | 'archived' })
      if (error) setFeedback({ type: 'error', msg: error })
      else router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      {/* Feedback */}
      {feedback && (
        <div className={`glass-panel p-3 flex items-center gap-3 ${feedback.type === 'ok' ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
          {feedback.type === 'ok'
            ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            : <XCircle size={15} className="text-red-400 shrink-0" />
          }
          <span className={`text-sm ${feedback.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="ml-auto text-slate-500 hover:text-slate-300 text-xs">✕</button>
        </div>
      )}

      {/* Header action */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-400/10 border border-violet-400/20 text-violet-400 text-sm font-medium hover:bg-violet-400/20 transition-colors"
        >
          <Plus size={14} />
          Novo formulário
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass-panel p-5 border-violet-400/20">
          <p className="text-xs font-mono uppercase tracking-widest text-violet-400 mb-4">Novo formulário</p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome do formulário"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-400/40"
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-400/40 resize-none min-h-[60px]"
            />
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-300">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={isPending || !name.trim()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-violet-400 text-black text-sm font-semibold hover:bg-violet-300 disabled:opacity-50 transition-colors"
            >
              {isPending && <Loader2 size={13} className="animate-spin" />}
              Criar
            </button>
          </div>
        </div>
      )}

      {/* Template list */}
      {templates.length === 0 ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center border-dashed">
          <FileText size={32} className="text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium text-sm">Nenhum formulário criado</p>
          <p className="text-slate-600 text-[11px] mt-2">
            Crie um formulário para que os Operadores possam fazer lançamentos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="glass-panel px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <FileText size={16} className="text-violet-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{t.name}</p>
                  {t.description && (
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">{t.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_BADGE[t.status]}`}>
                  {STATUS_LABEL[t.status]}
                </span>

                <button
                  onClick={() => handleToggleStatus(t.id, t.status)}
                  disabled={isPending}
                  title={t.status === 'active' ? 'Arquivar' : t.status === 'archived' ? 'Reativar como rascunho' : 'Ativar'}
                  className="p-1.5 rounded text-slate-600 hover:text-violet-400 hover:bg-violet-400/10 disabled:opacity-40 transition-colors"
                >
                  {t.status === 'active'
                    ? <Archive size={14} />
                    : t.status === 'draft'
                    ? <ToggleRight size={14} />
                    : <ToggleLeft size={14} />
                  }
                </button>

                <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
