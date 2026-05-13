'use client'

import { useState, useTransition } from 'react'
import { reviewEntry } from '@/actions/entries'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, XCircle, Flag, ChevronDown, ChevronUp,
  GitBranch, Loader2, Clock,
} from 'lucide-react'
import type { EntryRow } from './page'

const STATUS_COLOR: Record<string, string> = {
  pending:  'text-yellow-400',
  approved: 'text-emerald-400',
  rejected: 'text-red-400',
  flagged:  'text-orange-400',
}

export default function WorkbenchClient({ entries }: { entries: EntryRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  function toggle(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  function handleReview(entryId: string, decision: 'approved' | 'rejected' | 'flagged') {
    setReviewingId(entryId)
    startTransition(async () => {
      await reviewEntry(entryId, decision, notesMap[entryId] ?? undefined)
      setReviewingId(null)
      router.refresh()
    })
  }

  if (entries.length === 0) {
    return (
      <div className="glass-panel p-12 flex flex-col items-center justify-center text-center border-dashed">
        <GitBranch size={32} className="text-slate-700 mb-4" />
        <p className="text-slate-400 font-medium text-sm">Fila vazia</p>
        <p className="text-slate-600 text-[11px] mt-2">
          Quando Operadores fizerem lançamentos, aparecerão aqui para revisão.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isExpanded  = expandedId === entry.id
        const isReviewing = reviewingId === entry.id && isPending
        const valueKeys   = Object.keys(entry.values)

        return (
          <div key={entry.id} className="glass-panel overflow-hidden">
            {/* Header row */}
            <button
              onClick={() => toggle(entry.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <Clock size={14} className="text-yellow-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-200">{entry.template_name}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {entry.submitter_name ?? entry.submitted_by.slice(0, 8) + '…'} ·{' '}
                    {new Date(entry.submitted_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-mono uppercase ${STATUS_COLOR[entry.status]}`}>
                  {entry.status}
                </span>
                {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="px-5 pb-5 border-t border-white/[0.05]">
                {/* Values */}
                <div className="mt-4 mb-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mb-3">Valores</p>
                  <div className="grid grid-cols-2 gap-2">
                    {valueKeys.length === 0 ? (
                      <p className="text-slate-600 text-xs col-span-2">Sem dados</p>
                    ) : (
                      valueKeys.map(key => (
                        <div key={key} className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]">
                          <p className="text-[10px] font-mono text-slate-600 mb-1">{key}</p>
                          <p className="text-sm text-slate-300">{String(entry.values[key] ?? '—')}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mb-2">Notas (opcional)</p>
                  <textarea
                    value={notesMap[entry.id] ?? ''}
                    onChange={e => setNotesMap(prev => ({ ...prev, [entry.id]: e.target.value }))}
                    placeholder="Motivo da rejeição, observações..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-violet-400/30 resize-none min-h-[60px]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReview(entry.id, 'approved')}
                    disabled={isReviewing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                  >
                    {isReviewing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleReview(entry.id, 'rejected')}
                    disabled={isReviewing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                  >
                    {isReviewing ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleReview(entry.id, 'flagged')}
                    disabled={isReviewing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/20 disabled:opacity-50 transition-colors"
                  >
                    {isReviewing ? <Loader2 size={13} className="animate-spin" /> : <Flag size={13} />}
                    Sinalizar
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
