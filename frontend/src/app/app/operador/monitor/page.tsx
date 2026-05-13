import { Activity, ClipboardList, Clock, AlertCircle } from 'lucide-react'

export default function OperadorMonitorPage() {
  return (
    <div className="p-8">
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
          Status em tempo real · Atividades · Alertas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Lançamentos Hoje', value: '—', icon: ClipboardList, color: 'text-emerald-400', note: 'Registrados por você' },
          { label: 'Pendentes de Revisão', value: '—', icon: Clock, color: 'text-yellow-400', note: 'Aguardando Analista' },
          { label: 'Alertas Ativos', value: '—', icon: AlertCircle, color: 'text-red-400', note: 'Requerem atenção' },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={56} />
            </div>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-4">{stat.label}</p>
            <h3 className={`text-4xl font-bold ${stat.color}`}>{stat.value}</h3>
            <p className="text-slate-600 text-[10px] mt-3">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-8 flex flex-col items-center justify-center text-center min-h-[200px] border-dashed">
        <Activity size={32} className="text-slate-700 mb-4" />
        <p className="text-slate-400 font-medium text-sm">Nenhuma atividade registrada hoje</p>
        <p className="text-slate-600 text-[11px] mt-2">
          Acesse <span className="text-emerald-400">Lançamentos</span> para registrar novos dados.
        </p>
      </div>
    </div>
  )
}
