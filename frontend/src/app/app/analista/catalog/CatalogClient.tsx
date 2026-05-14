'use client'

import { useState, useTransition } from 'react'
import { upsertFormField, deleteFormField } from '@/actions/forms'
import { useRouter } from 'next/navigation'
import {
  Database, ChevronDown, ChevronRight, Plus, Trash2, Loader2,
  Tag, CheckCircle2, XCircle, Shield,
} from 'lucide-react'
import type { CatalogTemplate, CatalogField } from './page'

const FIELD_TYPE_BADGE: Record<string, string> = {
  text:        'bg-slate-500/10 text-slate-400 border-slate-500/20',
  textarea:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
  number:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  currency:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  percentage:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  date:        'bg-violet-500/10 text-violet-400 border-violet-500/20',
  datetime:    'bg-violet-500/10 text-violet-400 border-violet-500/20',
  select:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  multiselect: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  boolean:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  email:       'bg-pink-500/10 text-pink-400 border-pink-500/20',
}

const STATUS_BADGE: Record<string, string> = {
  draft:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  active:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  archived: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
}

const FIELD_TYPES = [
  'text', 'textarea', 'number', 'currency', 'percentage',
  'date', 'datetime', 'select', 'multiselect', 'boolean', 'email',
]

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

type NewField = {
  label: string
  field_type: string
  required: boolean
  help_text: string
  options: string
}

function AddFieldForm({
  templateId,
  nextIndex,
  onDone,
}: {
  templateId: string
  nextIndex: number
  onDone: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [field, setField] = useState<NewField>({
    label: '',
    field_type: 'text',
    required: false,
    help_text: '',
    options: '',
  })
  const [error, setError] = useState<string | null>(null)

  const needsOptions = field.field_type === 'select' || field.field_type === 'multiselect'

  function handleSave() {
    if (!field.label.trim()) return
    const name = slugify(field.label)
    const options = needsOptions
      ? { choices: field.options.split(',').map(s => s.trim()).filter(Boolean) }
      : null

    startTransition(async () => {
      const { error: err } = await upsertFormField(templateId, {
        name,
        label:       field.label.trim(),
        field_type:  field.field_type,
        required:    field.required,
        order_index: nextIndex,
        help_text:   field.help_text.trim() || undefined,
        options:     options ?? undefined,
      })
      if (err) { setError(err); return }
      router.refresh()
      onDone()
    })
  }

  return (
    <div className="mt-3 p-4 bg-white/[0.03] rounded-lg border border-white/10 space-y-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">Novo campo</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Label</label>
          <input
            type="text"
            placeholder="Ex: Receita Bruta"
            value={field.label}
            onChange={e => setField(f => ({ ...f, label: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Tipo</label>
          <select
            value={field.field_type}
            onChange={e => setField(f => ({ ...f, field_type: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-primary/40"
          >
            {FIELD_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {needsOptions && (
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Opções (separadas por vírgula)</label>
          <input
            type="text"
            placeholder="Ex: Sim, Não, Parcial"
            value={field.options}
            onChange={e => setField(f => ({ ...f, options: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
          />
        </div>
      )}

      <div>
        <label className="block text-[10px] text-slate-500 mb-1">Texto de ajuda (opcional)</label>
        <input
          type="text"
          placeholder="Instrução para o operador..."
          value={field.help_text}
          onChange={e => setField(f => ({ ...f, help_text: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={field.required}
          onChange={e => setField(f => ({ ...f, required: e.target.checked }))}
          className="accent-primary"
        />
        <span className="text-sm text-slate-400">Obrigatório</span>
      </label>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onDone} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={isPending || !field.label.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-black text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          Salvar campo
        </button>
      </div>
    </div>
  )
}

function TemplateCard({ template }: { template: CatalogTemplate }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  function handleDeleteField(fieldId: string) {
    startTransition(async () => {
      await deleteFormField(fieldId)
      router.refresh()
    })
  }

  return (
    <div className="glass-panel overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          <Database size={15} className="text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200">{template.name}</p>
            {template.description && (
              <p className="text-[11px] text-slate-600 truncate mt-0.5">{template.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-slate-600 font-mono">
            {template.fields.length} campos
          </span>
          {template.rules_count > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-violet-400 font-mono">
              <Shield size={10} />
              {template.rules_count} regras
            </span>
          )}
          <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${STATUS_BADGE[template.status] ?? STATUS_BADGE.draft}`}>
            {template.status}
          </span>
          {expanded
            ? <ChevronDown size={14} className="text-slate-500" />
            : <ChevronRight size={14} className="text-slate-600" />
          }
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/5 px-5 py-4">
          {template.fields.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-3">
              Nenhum campo configurado.
            </p>
          ) : (
            <div className="space-y-1 mb-3">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-600 border-b border-white/5 mb-2">
                <span>Label / Nome</span>
                <span>Tipo</span>
                <span>Obrig.</span>
                <span>Ajuda</span>
                <span></span>
              </div>
              {template.fields.map(field => (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">{field.label}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{field.name}</p>
                  </div>
                  <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${FIELD_TYPE_BADGE[field.field_type] ?? FIELD_TYPE_BADGE.text}`}>
                    {field.field_type}
                  </span>
                  <span>
                    {field.required
                      ? <CheckCircle2 size={13} className="text-emerald-400" />
                      : <XCircle size={13} className="text-slate-700" />
                    }
                  </span>
                  <span className="text-[11px] text-slate-600 truncate max-w-[160px]">
                    {field.help_text ?? '—'}
                  </span>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    disabled={isPending}
                    className="p-1 rounded text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                    title="Remover campo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showAdd ? (
            <AddFieldForm
              templateId={template.id}
              nextIndex={template.fields.length}
              onDone={() => setShowAdd(false)}
            />
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all"
            >
              <Plus size={13} />
              Adicionar campo
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function CatalogClient({ templates }: { templates: CatalogTemplate[] }) {
  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-6 mb-6 px-1">
        <div className="flex items-center gap-2">
          <Tag size={12} className="text-slate-600" />
          <span className="text-[11px] text-slate-500">
            {templates.length} formulários
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Tag size={12} className="text-slate-600" />
          <span className="text-[11px] text-slate-500">
            {templates.reduce((s, t) => s + t.fields.length, 0)} campos totais
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={12} className="text-violet-400/60" />
          <span className="text-[11px] text-slate-500">
            {templates.reduce((s, t) => s + t.rules_count, 0)} regras ativas
          </span>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center text-center border-dashed">
          <Database size={32} className="text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium text-sm">Nenhum template encontrado</p>
          <p className="text-slate-600 text-[11px] mt-2">
            Crie formulários em <span className="text-primary">Formulários</span>.
          </p>
        </div>
      ) : (
        templates.map(t => <TemplateCard key={t.id} template={t} />)
      )}
    </div>
  )
}
