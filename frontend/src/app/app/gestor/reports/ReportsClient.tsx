'use client'

import { useState } from 'react'
import {
  CheckCircle2, XCircle, Clock, Flag, Filter, TrendingUp,
} from 'lucide-react'
import type { ReportEntry, ReportTemplate } from './page'

const STATUS_STYLE: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  pending:  { label: 'Pendente',   class: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10', icon: Clock },
  approved: { label: 'Aprovado',   class: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10', icon: CheckCircle2 },
  rejected: { label: 'Rejeitado',  class: 'text-red-400 border-red-500/20 bg-red-500/10', icon: XCircle },
  flagged:  { label: 'Sinalizado', class: 'text-orange-400 border-orange-500/20 bg-orange-500/10', icon: Flag },
}

const STATUS_TABS = [
  { value: '',         label: 'Todos' },
  { value: 'pending',  label: 'Pendentes' },
  { value: 'approved', label: 'Aprovados' },
  { value: 'rejected', label: 'Rejeitados' },
  { value: 'flagged',  label: 'Sinalizados' },
]

export default function ReportsClient({
  entries,
  templates,
}: {
  entries: ReportEntry[]
  templates: ReportTemplate[]
}) {
  const [statusFilter, setStatusFilter] = useState('')
  const [templateFilter, setTemplateFilter] = useState('')

  const filtered = entries.filter(e => {
    if (statusFilter   && e.status      !== statusFilter)   return false
    if (templateFilter && e.template_id !== templateFilter) return false
    return true
  })

  const totalApproved = entries.filter(e => e.status === 'approved').length
  const totalPending  = entries.filter(e => e.status === 'pending').length
  const totalRejected = entries.filter(e => e.status === 'rejected').length
  const totalFlagged  = entries.filter(e => e.status === 'flagged').length
  const approvalRate  = entries.length > 0 ? Math.round((totalApproved / entries.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',        value: entries.length,  color: 'text-slate-300', icon: TrendingUp },
          { label: 'Aprovados',    value: totalApproved,   color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Pendentes',    value: totalPending,    color: 'text-yellow-400', icon: Clock },
          { label: 'Rejeitados',   value: totalRejected,   color: 'text-red-400', icon: XCircle },
          { label: 'Taxa Aproval.', value: `${approvalRate}%`, color: 'text-primary', icon: TrendingUp },
        ].map(stat => (
          <div key={stat.label} className="glass-panel p-4 relative overflow-hidden">
            <p className="text-slate-600 text-[10px] font-mono uppercase tracking-widest mb-2">{stat.label}</p>
            <h3 className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-slate-600" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600">Filtros</span>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === tab.value
                  ? 'bg-primary text-black'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Template select */}
        <select
          value={templateFilter}
          onChange={e => setTemplateFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-primary/40 transition-colors"
        >
          <option value="">Todos os formulários</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {(statusFilter || templateFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setTemplateFilter('') }}
            className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
          >
            Limpar filtros
          </button>
        )}

        <span className="ml-auto text-[10px] text-slate-600 font-mono">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/5 text-[10px] font-mono uppercase tracking-widest text-slate-600">
          <span>Formulário</span>
          <span>Operador</span>
          <span>Data</span>
          <span>Status</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp size={28} className="text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">Nenhuma entrada encontrada</p>
            {(statusFilter || templateFilter) && (
              <p className="text-slate-600 text-[11px] mt-1">Tente ajustar os filtros.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filtered.map(entry => {
              const style = STATUS_STYLE[entry.status] ?? STATUS_STYLE.pending
              const StatusIcon = style.icon
              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 truncate">{entry.template_name}</p>
                    {entry.review_notes && (
                      <p className="text-[10px] text-slate-600 truncate mt-0.5">↳ {entry.review_notes}</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">
                    {entry.submitter_name ?? '—'}
                  </p>
                  <p className="text-[11px] text-slate-600 font-mono tabular-nums">
                    {new Date(entry.submitted_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={`flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${style.class}`}>
                    <StatusIcon size={9} />
                    {style.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
