'use client'

import { useState, useTransition } from 'react'
import { getFormTemplate } from '@/actions/forms'
import { submitEntry } from '@/actions/entries'
import { useRouter } from 'next/navigation'
import {
  ClipboardList, ArrowLeft, Loader2, CheckCircle2, XCircle, Send,
} from 'lucide-react'
import type { TemplateCard } from './page'

type FormField = {
  id: string
  name: string
  label: string
  field_type: string
  required: boolean
  options: unknown
  default_value: string | null
  help_text: string | null
  order_index: number
}

type LoadedTemplate = {
  id: string
  name: string
  description: string | null
  fields: FormField[]
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: unknown
  onChange: (v: unknown) => void
}) {
  const base = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-400/40 transition-colors'

  const choices: string[] = Array.isArray(field.options)
    ? (field.options as string[])
    : ((field.options as { choices?: string[] } | null)?.choices ?? [])

  switch (field.field_type) {
    case 'select':
      return (
        <select value={String(value ?? '')} onChange={e => onChange(e.target.value)} className={base}>
          <option value="">Selecione...</option>
          {choices.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )
    case 'boolean':
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => onChange(!value)}
            className={`w-10 h-5 rounded-full transition-colors relative ${value ? 'bg-emerald-500' : 'bg-white/10'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-slate-400">{value ? 'Sim' : 'Não'}</span>
        </label>
      )
    case 'textarea':
      return (
        <textarea
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          placeholder={field.help_text ?? ''}
          className={`${base} min-h-[80px] resize-y`}
        />
      )
    default:
      return (
        <input
          type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : field.field_type === 'email' ? 'email' : 'text'}
          value={String(value ?? field.default_value ?? '')}
          onChange={e => onChange(e.target.value)}
          placeholder={field.help_text ?? ''}
          className={base}
        />
      )
  }
}

export default function LaunchClient({ templates }: { templates: TemplateCard[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [selected, setSelected] = useState<LoadedTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  async function handleSelectTemplate(t: TemplateCard) {
    setLoading(true)
    setFeedback(null)
    const { data } = await getFormTemplate(t.id)
    setLoading(false)
    if (!data) return

    const fields = (data.fields ?? []) as FormField[]
    const initial: Record<string, unknown> = {}
    fields.forEach(f => { initial[f.name] = f.default_value ?? '' })

    setSelected({ id: data.id, name: data.name, description: data.description, fields })
    setValues(initial)
  }

  function handleFieldChange(fieldName: string, val: unknown) {
    setValues(prev => ({ ...prev, [fieldName]: val }))
  }

  function handleSubmit() {
    if (!selected) return

    const missing = selected.fields.filter(f => f.required && (values[f.name] === '' || values[f.name] === null || values[f.name] === undefined))
    if (missing.length > 0) {
      setFeedback({ type: 'error', msg: `Preencha os campos obrigatórios: ${missing.map(f => f.label).join(', ')}` })
      return
    }

    startTransition(async () => {
      const { error } = await submitEntry(selected.id, values)
      if (error) {
        setFeedback({ type: 'error', msg: error })
      } else {
        setFeedback({ type: 'ok', msg: 'Lançamento enviado com sucesso!' })
        setSelected(null)
        setValues({})
        router.refresh()
      }
    })
  }

  if (templates.length === 0) {
    return (
      <div className="glass-panel p-12 flex flex-col items-center justify-center text-center border-dashed">
        <ClipboardList size={32} className="text-slate-700 mb-4" />
        <p className="text-slate-400 font-medium text-sm">Nenhum formulário disponível</p>
        <p className="text-slate-600 text-[11px] mt-2">
          O Analista precisa criar e ativar formulários para que você possa lançar dados.
        </p>
      </div>
    )
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
          <button onClick={() => setFeedback(null)} className="ml-auto text-slate-500 text-xs">✕</button>
        </div>
      )}

      {/* Template selection */}
      {!selected && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mb-4">
            Selecione o formulário
          </p>
          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
              <Loader2 size={14} className="animate-spin" />
              Carregando campos...
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                disabled={loading}
                className="glass-panel p-5 text-left hover:bg-white/[0.04] hover:border-emerald-400/20 transition-all group disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-400/10 rounded flex items-center justify-center border border-emerald-400/20 shrink-0 group-hover:bg-emerald-400/20 transition-colors">
                    <ClipboardList size={14} className="text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200">{t.name}</p>
                    {t.description && (
                      <p className="text-[11px] text-slate-600 mt-1 truncate">{t.description}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic form */}
      {selected && (
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => { setSelected(null); setValues({}); setFeedback(null) }}
              className="p-1.5 rounded text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-200">{selected.name}</p>
              {selected.description && (
                <p className="text-[11px] text-slate-600 mt-0.5">{selected.description}</p>
              )}
            </div>
          </div>

          {selected.fields.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-6">
              Nenhum campo configurado neste formulário.
            </p>
          ) : (
            <div className="space-y-5">
              {selected.fields.map(field => (
                <div key={field.id}>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <FieldInput
                    field={field}
                    value={values[field.name]}
                    onChange={v => handleFieldChange(field.name, v)}
                  />
                </div>
              ))}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                >
                  {isPending
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Send size={14} />
                  }
                  Enviar lançamento
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
