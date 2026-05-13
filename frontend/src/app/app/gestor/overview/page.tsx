import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getPendingCount } from '@/actions/entries'
import { getDashboards } from '@/actions/dashboards'
import { getAgentRequests } from '@/actions/agents'
import { BarChart3, Users, TrendingUp, Bot, Clock, AlertCircle } from 'lucide-react'

export default async function GestorOverviewPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const companyId = cookieStore.get('active_company_id')?.value ?? ''

  const [
    { count: pendingCount },
    { data: dashboards },
    { data: agents },
    { count: membersCount },
  ] = await Promise.all([
    getPendingCount(),
    getDashboards('published'),
    getAgentRequests(),
    supabase
      .from('company_members')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .then(r => ({ count: r.count ?? 0 })),
  ])

  const stats = [
    {
      label: 'Entradas Pendentes',
      value: pendingCount,
      icon: Clock,
      color: pendingCount > 0 ? 'text-yellow-400' : 'text-slate-400',
      note: 'Aguardando revisão do Analista',
    },
    {
      label: 'Membros da Equipe',
      value: membersCount,
      icon: Users,
      color: 'text-primary',
      note: 'Analistas e Operadores cadastrados',
    },
    {
      label: 'Dashboards Publicados',
      value: dashboards?.length ?? 0,
      icon: TrendingUp,
      color: 'text-emerald-400',
      note: 'Certificados pelos Analistas',
    },
  ]

  const recentAgents = agents?.slice(0, 6) ?? []

  const STATUS_STYLE: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    failed:    'bg-red-500/10 text-red-400 border-red-500/20',
    running:   'bg-primary/10 text-primary border-primary/20',
    pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center border border-primary/30">
            <BarChart3 size={16} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Overview <span className="text-primary">Executivo</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
          Dados em tempo real da sua empresa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-[0.07] transition-opacity">
              <stat.icon size={64} />
            </div>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-4">
              {stat.label}
            </p>
            <h3 className={`text-5xl font-bold tabular-nums ${stat.color}`}>
              {stat.value}
            </h3>
            <p className="text-slate-600 text-[10px] mt-3">{stat.note}</p>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="glass-panel p-4 mb-6 flex items-center gap-3 border-yellow-500/20">
          <AlertCircle size={16} className="text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-400">
            {pendingCount} entrada{pendingCount > 1 ? 's' : ''} aguarda{pendingCount === 1 ? '' : 'm'} revisão do Analista.
          </p>
        </div>
      )}

      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bot size={14} className="text-primary" />
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            Agentes IA Recentes
          </span>
        </div>

        {recentAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bot size={28} className="text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">Nenhum agente executado ainda</p>
            <p className="text-slate-600 text-[11px] mt-1">
              O Analista pode disparar agentes em Agentes IA.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentAgents.map((req: {
              id: string
              agent_type: string
              status: string
              created_at: string
            }) => (
              <div
                key={req.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <span className="text-sm text-slate-300 font-mono">{req.agent_type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-600">
                    {new Date(req.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLE[req.status] ?? STATUS_STYLE.pending}`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
