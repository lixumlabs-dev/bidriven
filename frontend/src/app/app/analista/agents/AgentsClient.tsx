'use client'

import { useState, useTransition } from 'react'
import { requestAgent } from '@/actions/agents'
import type { AgentType } from '@/actions/agents'
import { useRouter } from 'next/navigation'
import {
  Bot, Send, Loader2, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, Clock, Zap,
} from 'lucide-react'
import type { AgentRequest } from './page'

const AGENT_OPTIONS: { value: AgentType; label: string; description: string }[] = [
  { value: 'analyze_data',    label: 'Analisar Dados',      description: 'Insights e tendências sobre entradas recentes' },
  { value: 'validate_entries', label: 'Validar Entradas',   description: 'Auditoria de qualidade dos lançamentos' },
  { value: 'apply_rules',     label: 'Aplicar Regras',      description: 'Verifica violações das regras de negócio' },
  { value: 'build_dashboard', label: 'Sugerir Dashboard',   description: 'Recomenda layout de painel com base nos dados' },
  { value: 'suggest_model',   label: 'Sugerir Modelo',      description: 'Propõe um modelo de dados otimizado' },
  { value: 'generate_report', label: 'Gerar Relatório',     description: 'Relatório executivo em linguagem natural' },
]

const STATUS_STYLE: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  completed: { label: 'Concluído', class: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10', icon: CheckCircle2 },
  failed:    { label: 'Falhou',    class: 'text-red-400 border-red-500/20 bg-red-500/10',             icon: XCircle },
  running:   { label: 'Rodando',   class: 'text-primary border-primary/20 bg-primary/10',             icon: Loader2 },
  pending:   { label: 'Pendente',  class: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10',   icon: Clock },
}

function parseOutput(raw: string | undefined): string {
  if (!raw) return ''
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    return JSON.stringify(JSON.parse(cleaned), null, 2)
  } catch {
    return raw
  }
}

function RequestCard({ req }: { req: AgentRequest }) {
  const [expanded, setExpanded] = useState(false)
  const style = STATUS_STYLE[req.status] ?? STATUS_STYLE.pending
  const StatusIcon = style.icon
  const latestRun = req.runs?.[0]
  const output = latestRun?.result?.output

  return (
    <div className="glass-panel overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-6 h-6 bg-violet-400/10 rounded flex items-center justify-center border border-violet-400/20 shrink-0">
            <Bot size={12} className="text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200">
              {AGENT_OPTIONS.find(a => a.value === req.agent_type)?.label ?? req.agent_type}
            </p>
            {req.prompt && (
              <p className="text-[11px] text-slate-600 truncate mt-0.5">{req.prompt}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {latestRun?.tokens_used && (
            <span className="flex items-center gap-1 text-[10px] text-slate-600 font-mono">
              <Zap size={9} />
              {latestRun.tokens_used.toLocaleString()} tokens
            </span>
          )}
          <span className="text-[10px] text-slate-600">
            {new Date(req.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className={`flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${style.class}`}>
            <StatusIcon size={9} className={req.status === 'running' ? 'animate-spin' : ''} />
            {style.label}
          </span>
          {expanded
            ? <ChevronDown size={13} className="text-slate-500" />
            : <ChevronRight size={13} className="text-slate-600" />
          }
        </div>
      </button>

      {expanded && output && (
        <div className="border-t border-white/5 px-5 py-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mb-3">Saída do agente</p>
          <pre className="text-[11px] text-slate-400 font-mono bg-black/30 rounded-lg p-4 overflow-auto max-h-80 whitespace-pre-wrap leading-relaxed">
            {parseOutput(output)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function AgentsClient({ requests }: { requests: AgentRequest[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedType, setSelectedType] = useState<AgentType>('analyze_data')
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleRun() {
    setError(null)
    startTransition(async () => {
      const { error: err } = await requestAgent(selectedType, {}, prompt.trim() || undefined)
      if (err) {
        setError(err)
      } else {
        setPrompt('')
        router.refresh()
      }
    })
  }

  const selectedAgent = AGENT_OPTIONS.find(a => a.value === selectedType)

  return (
    <div className="space-y-6">
      {/* Request panel */}
      <div className="glass-panel p-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-violet-400 mb-5">
          Disparar agente
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {AGENT_OPTIONS.map(agent => (
            <button
              key={agent.value}
              onClick={() => setSelectedType(agent.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedType === agent.value
                  ? 'border-violet-400/40 bg-violet-400/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <p className={`text-sm font-medium ${selectedType === agent.value ? 'text-violet-400' : 'text-slate-300'}`}>
                {agent.label}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">{agent.description}</p>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
            Instrução adicional (opcional)
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={`Contexto ou foco específico para o agente ${selectedAgent?.label ?? ''}...`}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-400/40 resize-none min-h-[70px] transition-colors"
          />
        </div>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <div className="flex justify-end">
          <button
            onClick={handleRun}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-400 text-black text-sm font-semibold hover:bg-violet-300 disabled:opacity-50 transition-colors"
          >
            {isPending
              ? <Loader2 size={14} className="animate-spin" />
              : <Send size={14} />
            }
            {isPending ? 'Executando...' : 'Executar agente'}
          </button>
        </div>
      </div>

      {/* History */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mb-3 px-1">
          Histórico
        </p>

        {requests.length === 0 ? (
          <div className="glass-panel p-10 flex flex-col items-center justify-center text-center border-dashed">
            <Bot size={28} className="text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">Nenhum agente executado ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map(req => (
              <RequestCard key={req.id} req={req} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
