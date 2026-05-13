import { GitBranch, Database, Bot, CheckCircle2 } from 'lucide-react'

export default function AnalistaWorkbenchPage() {
  return (
    <div className="p-8">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-violet-400/20 rounded flex items-center justify-center border border-violet-400/30">
            <GitBranch size={16} className="text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Work<span className="text-violet-400">bench</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
          Regras de negócio · Validação · Modelagem
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Modelos Pendentes', value: '—', icon: Database, color: 'text-violet-400', note: 'Aguardando validação' },
          { label: 'Lançamentos Novos', value: '—', icon: CheckCircle2, color: 'text-emerald-400', note: 'Dos Operadores hoje' },
          { label: 'Agentes Ativos', value: '—', icon: Bot, color: 'text-primary', note: 'Em execução' },
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
        <GitBranch size={32} className="text-slate-700 mb-4" />
        <p className="text-slate-400 font-medium text-sm">Fila de validação vazia</p>
        <p className="text-slate-600 text-[11px] mt-2">
          Quando Operadores fizerem lançamentos, aparecerão aqui para revisão.
        </p>
      </div>
    </div>
  )
}
