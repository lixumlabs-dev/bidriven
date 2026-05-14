import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Activity, ClipboardList, Clock, Flag, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const STATUS_STYLE: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  pending:  { label: 'Pendente',  class: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10', icon: Clock },
  approved: { label: 'Aprovado',  class: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10', icon: CheckCircle2 },
  rejected: { label: 'Rejeitado', class: 'text-red-400 border-red-500/20 bg-red-500/10', icon: XCircle },
  flagged:  { label: 'Sinalizado', class: 'text-orange-400 border-orange-500/20 bg-orange-500/10', icon: Flag },
}

type RawEntry = {
  id: string
  submitted_at: string
  status: string
  template: Array<{ name: string }> | { name: string } | null
}

function templateName(t: RawEntry['template']): string {
  if (!t) return '—'
  return Array.isArray(t) ? (t[0]?.name ?? '—') : t.name
}

export default async function OperadorMonitorPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const companyId = cookieStore.get('active_company_id')?.value ?? ''
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    { count: todayCount },
    { count: pendingCount },
    { count: flaggedCount },
    { data: recentEntries },
  ] = await Promise.all([
    supabase
      .from('data_entries')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('submitted_by', user.id)
      .gte('submitted_at', todayStart.toISOString()),

    supabase
      .from('data_entries')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('submitted_by', user.id)
      .eq('status', 'pending'),

    supabase
      .from('data_entries')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('submitted_by', user.id)
      .eq('status', 'flagged'),

    supabase
      .from('data_entries')
      .select('id, submitted_at, status, template:form_templates(name)')
      .eq('company_id', companyId)
      .eq('submitted_by', user.id)
      .order('submitted_at', { ascending: false })
      .limit(15),
  ])

  const stats = [
    { label: 'Lançamentos Hoje',      value: todayCount ?? 0,   icon: ClipboardList, color: 'text-emerald-400', note: 'Registrados por você hoje' },
    { label: 'Pendentes de Revisão',  value: pendingCount ?? 0, icon: Clock,         color: 'text-yellow-400', note: 'Aguardando aprovação do Analista' },
    { label: 'Sinalizados',           value: flaggedCount ?? 0, icon: AlertCircle,   color: 'text-orange-400', note: 'Requerem sua atenção' },
  ]

  const rows = ((recentEntries as unknown as RawEntry[]) ?? [])

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-emerald-400/20 rounded flex items-center justify-center border border-emerald-400/30">
            <Activity size={16} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Monitor <span className="text-emerald-400">Operacional</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
          Seus lançamentos · Status em tempo real
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-[0.07] transition-opacity">
              <stat.icon size={64} />
            </div>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-4">{stat.label}</p>
            <h3 className={`text-5xl font-bold tabular-nums ${stat.color}`}>{stat.value}</h3>
            <p className="text-slate-600 text-[10px] mt-3">{stat.note}</p>
          </div>
        ))}
      </div>

      {flaggedCount !== null && flaggedCount > 0 && (
        <div className="glass-panel p-4 mb-6 flex items-center gap-3 border-orange-500/20">
          <AlertCircle size={15} className="text-orange-400 shrink-0" />
          <p className="text-sm text-orange-400">
            Você tem {flaggedCount} lançamento{flaggedCount > 1 ? 's' : ''} sinalizado{flaggedCount > 1 ? 's' : ''} pelo Analista — verifique e faça um novo lançamento corrigido.
          </p>
        </div>
      )}

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              Histórico de Lançamentos
            </span>
          </div>
          <Link
            href="/app/operador/lancamentos"
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono uppercase tracking-wider transition-colors"
          >
            + Novo lançamento
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ClipboardList size={28} className="text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">Nenhum lançamento ainda</p>
            <p className="text-slate-600 text-[11px] mt-1">
              Acesse <span className="text-emerald-400">Lançamentos</span> para registrar dados.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {rows.map((entry) => {
              const style = STATUS_STYLE[entry.status] ?? STATUS_STYLE.pending
              const StatusIcon = style.icon
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 shrink-0" />
                    <span className="text-sm text-slate-300 truncate">{templateName(entry.template)}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-slate-600 tabular-nums">
                      {new Date(entry.submitted_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`flex items-center gap-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${style.class}`}>
                      <StatusIcon size={9} />
                      {style.label}
                    </span>
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
