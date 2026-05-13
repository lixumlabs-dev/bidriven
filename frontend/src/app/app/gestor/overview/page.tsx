import { BarChart3, Users, TrendingUp, Building2 } from 'lucide-react'

export default function GestorOverviewPage() {
  return (
    <div className="p-8">
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
          Visão consolidada das suas empresas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Empresas Ativas', value: '—', icon: Building2, note: 'Conectadas à plataforma' },
          { label: 'Membros da Equipe', value: '—', icon: Users, note: 'Analistas + Operadores' },
          { label: 'Dashboards Ativos', value: '—', icon: TrendingUp, note: 'Certificados pelo Analista' },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={56} />
            </div>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-4">{stat.label}</p>
            <h3 className="text-4xl font-bold text-primary">{stat.value}</h3>
            <p className="text-slate-600 text-[10px] mt-3">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-8 flex flex-col items-center justify-center text-center min-h-[200px] border-dashed">
        <BarChart3 size={32} className="text-slate-700 mb-4" />
        <p className="text-slate-400 font-medium text-sm">Dashboards aparecerão aqui</p>
        <p className="text-slate-600 text-[11px] mt-2">
          Solicite ao Analista a publicação de relatórios para esta empresa.
        </p>
      </div>
    </div>
  )
}
