import { Settings } from 'lucide-react'

export default function GestorSettingsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center border border-primary/30">
            <Settings size={16} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Configu<span className="text-primary">rações</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
          Empresa · Preferências · Integrações
        </p>
      </div>

      <div className="glass-panel p-10 flex flex-col items-center justify-center text-center border-dashed">
        <Settings size={28} className="text-slate-700 mb-3" />
        <p className="text-slate-400 text-sm">Em breve</p>
        <p className="text-slate-600 text-[11px] mt-1">
          Configurações da empresa serão disponibilizadas aqui.
        </p>
      </div>
    </div>
  )
}
