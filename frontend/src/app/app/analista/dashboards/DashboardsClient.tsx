'use client'

import { useState, useTransition } from 'react'
import { createDashboard, publishDashboard } from '@/actions/dashboards'
import { useRouter } from 'next/navigation'
import {
  BarChart3, Plus, Loader2, CheckCircle2, XCircle,
  Globe, FileEdit, Archive, TrendingUp, Clock, Flag,
} from 'lucide-react'
import type { DashboardRow, TemplateStats } from './page'

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  archived:  'bg-slate-500/10 text-slate-500 border-slate-500/20',
}

const STATUS_LABEL: Record<string, string> = {
  draft:     'Rascunho',
  published: 'Publicado',
  archived:  'Arquivado',
}

function ApprovalBar({ approved, total }: { approved: number; total: number }) {
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function DashboardsClient({
  dashboards,
  templateStats,
}: {
  dashboards: DashboardRow[]
  templateStats: TemplateStats[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      const { error } = await createDashboard({ name: name.trim(), description: description.trim() || undefined })
      if (error) {
        setFeedback({ type: 'error', msg: error })
      } else {
        setFeedback({ type: 'ok', msg: `Dashboard "${name}" criado com sucesso.` })
        setName('')
        setDescription('')
        setShowCreate(false)
        router.refresh()
      }
    })
  }

  function handlePublish(id: string) {
    startTransition(async () => {
      const { error } = await publishDashboard(id)
      if (error) setFeedback({ type: 'error', msg: error })
      else router.refresh()
    })
  }

  const totalEntries = templateStats.reduce((s, t) => s + t.total, 0)
  const totalApproved = templateStats.reduce((s, t) => s + t.approved, 0)
  const totalPending = templateStats.reduce((s, t) => s + t.pending, 0)
  const totalFlagged = templateStats.reduce((s, t) => s + t.flagged, 0)

  return (
    <div className="space-y-8">
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

      {/* KPI strip */}
      {totalEntries > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Entradas', value: totalEntries, icon: TrendingUp, color: 'text-primary' },
            { label: 'Aprovadas',      value: totalApproved, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Pendentes',      value: totalPending,  icon: Clock,       color: 'text-yellow-400' },
            { label: 'Sinalizadas',    value: totalFlagged,  icon: Flag,        color: 'text-orange-400' },
          ].map(stat => (
            <div key={stat.label} className="glass-panel p-4 relative overflow-hidden">
              <p className="text-slate-600 text-[10px] font-mono uppercase tracking-widest mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h3 className={`text-3xl font-bold tabular-nums ${stat.color}`}>{stat.value}</h3>
                <stat.icon size={20} className={`${stat.color} opacity-30`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template volume table */}
      {templateStats.length > 0 && (
        <div className="glass-panel p-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">
            Volume por formulário
          </p>
          <div className="space-y-3">
            {templateStats.map(stat => (
              <div key={stat.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">{stat.name}</span>
                  <div className="flex items-center gap-3 text-[10px] text-slate-600 font-mono">
                    <span className="text-emerald-400">{stat.approved} apr</span>
                    <span className="text-yellow-400">{stat.pending} pend</span>
                    {stat.flagged > 0 && <span className="text-orange-400">{stat.flagged} flag</span>}
                    {stat.rejected > 0 && <span className="text-red-400">{stat.rejected} rej</span>}
                    <span className="text-slate-500">{stat.total} total</span>
                  </div>
                </div>
                <ApprovalBar approved={stat.approved} total={stat.total} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboards list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Painéis salvos
          </p>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Plus size={13} />
            Novo painel
          </button>
        </div>

        {showCreate && (
          <div className="glass-panel p-5 border-primary/20 mb-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-4">Novo painel</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome do painel"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40 resize-none min-h-[60px]"
              />
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-300">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending || !name.trim()}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-black text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isPending && <Loader2 size={13} className="animate-spin" />}
                Criar painel
              </button>
            </div>
          </div>
        )}

        {dashboards.length === 0 ? (
          <div className="glass-panel p-10 flex flex-col items-center justify-center text-center border-dashed">
            <BarChart3 size={28} className="text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm">Nenhum painel criado ainda</p>
            <p className="text-slate-600 text-[11px] mt-1">
              Crie um painel e publique para o Gestor visualizar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dashboards.map(d => {
              const StatusIcon = d.status === 'published' ? Globe : d.status === 'archived' ? Archive : FileEdit
              return (
                <div key={d.id} className="glass-panel px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <BarChart3 size={15} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200">{d.name}</p>
                      {d.description && (
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">{d.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-slate-600">
                      {new Date(d.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${STATUS_BADGE[d.status] ?? STATUS_BADGE.draft}`}>
                      <StatusIcon size={9} />
                      {STATUS_LABEL[d.status] ?? d.status}
                    </span>
                    {d.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(d.id)}
                        disabled={isPending}
                        className="text-[11px] text-primary hover:text-primary/80 font-mono uppercase tracking-wider disabled:opacity-50 transition-colors"
                      >
                        Publicar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
