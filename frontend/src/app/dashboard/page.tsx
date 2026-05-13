import React from 'react';
import { Activity, Database, ShieldCheck, RefreshCw, BarChart3, Layers } from 'lucide-react';

const sources = [
  { name: 'Google Sheets', type: 'CSV', status: 'Healthy', rows: 100, lastSync: '2 mins ago', icon: Layers },
  { name: 'Customer Leads API', type: 'JSON', status: 'Healthy', rows: 50, lastSync: '5 mins ago', icon: Activity },
  { name: 'Legacy SQL Catalog', type: 'SQL', status: 'Warning', rows: 30, lastSync: '1 hour ago', icon: Database },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="flex justify-between items-end mb-12">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center border border-primary/30">
                <BarChart3 size={18} className="text-primary" />
             </div>
             <h1 className="text-2xl font-bold tracking-tight">Observability <span className="text-primary">Center</span></h1>
          </div>
          <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">AWS RDS :: US-EAST-1 :: PRODUCTION</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel px-4 py-2 flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full glow-primary animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Stream Status: Active</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Database size={64} />
          </div>
          <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-4">Total Rows Ingested</p>
          <h3 className="text-4xl font-bold">180</h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-green-500 text-[10px] font-bold">+12.5%</span>
            <span className="text-slate-600 text-[10px]">vs previous cycle</span>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Layers size={64} />
          </div>
          <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-4">Active Connectors</p>
          <h3 className="text-4xl font-bold">3 / 3</h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-primary text-[10px] font-bold">Ready</span>
            <span className="text-slate-600 text-[10px]">All systems nominal</span>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck size={64} />
          </div>
          <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mb-4">Quality Score</p>
          <h3 className="text-4xl font-bold text-primary">98.2<span className="text-sm font-normal text-slate-500">%</span></h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-blue-400 text-[10px] font-bold">Verified</span>
            <span className="text-slate-600 text-[10px]">2 warnings detected</span>
          </div>
        </div>
      </div>

      {/* Sources Table */}
      <div className="glass-panel overflow-hidden border-white/5">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Data Stream Orchestration</h2>
          <button className="flex items-center gap-2 text-[10px] font-mono text-primary hover:text-white transition-colors bg-primary/10 px-3 py-1 rounded border border-primary/20">
            <RefreshCw size={12} /> RE-SYNC ALL
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[9px] font-mono text-slate-600 uppercase tracking-widest border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Source Identity</th>
                <th className="px-6 py-4">Protocol</th>
                <th className="px-6 py-4">Integrity</th>
                <th className="px-6 py-4">Throughput</th>
                <th className="px-6 py-4 text-right">Monitoring</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sources.map((source) => (
                <tr key={source.name} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
                        <source.icon size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white mb-0.5">{source.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono tracking-tight">SYNC_UID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="px-2 py-0.5 bg-slate-900 border border-white/10 rounded text-[9px] font-mono text-slate-400">{source.type}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-1 rounded-full ${source.status === 'Healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className={`text-[11px] font-medium ${source.status === 'Healthy' ? 'text-green-500/80' : 'text-yellow-500/80'}`}>{source.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-sm font-mono text-slate-300">{source.rows} <span className="text-[10px] text-slate-600">ROWS</span></div>
                    <div className="w-16 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary/40" style={{ width: source.rows === 100 ? '100%' : source.rows === 50 ? '50%' : '30%' }} />
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button className="text-[10px] font-mono text-primary hover:text-white underline decoration-primary/30 underline-offset-4 decoration-2">INSPECT</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
