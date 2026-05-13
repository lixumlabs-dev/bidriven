import React from 'react';
import { Box, FileCode2, Database, Search, Filter, Plus, Activity, ChevronRight } from 'lucide-react';

const entities = [
  { name: 'Unified Sales', table: 'sales', fields: 6, rows: 100, architect: 'DataArchitectAgent', tag: 'CORE' },
  { name: 'Customer Leads', table: 'leads', fields: 7, rows: 50, architect: 'DataArchitectAgent', tag: 'GROWTH' },
  { name: 'Product Catalog', table: 'legacy_products', fields: 6, rows: 30, architect: 'Legacy Import', tag: 'REF' },
];

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Data <span className="text-primary">Catalog</span></h1>
          <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.3em]">Unified Intelligence Assets</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Search entities..." 
                className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary/50 w-64"
              />
           </div>
           <button className="bg-white/5 border border-white/10 p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Filter size={16} className="text-slate-400" />
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {entities.map((entity) => (
          <div key={entity.table} className="glass-panel p-8 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full translate-x-16 -translate-y-16 group-hover:bg-primary/10 transition-colors" />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <Database size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{entity.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-[10px] text-slate-500 font-mono">TABLE: {entity.table}</code>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span className="text-[9px] font-bold text-primary/80 tracking-widest">{entity.tag}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex -space-x-2">
                   <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-[#0A0C10] flex items-center justify-center text-[8px] font-bold">DA</div>
                   <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-[#0A0C10] flex items-center justify-center text-[8px] font-bold text-primary">AI</div>
                </div>
                <span className="text-[8px] text-slate-600 font-mono mt-2 uppercase tracking-tighter">Ownership: {entity.architect}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 border-y border-white/5 py-8 mb-8 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <FileCode2 size={12} />
                  <p className="text-[10px] font-mono uppercase tracking-widest">Attributes</p>
                </div>
                <p className="text-2xl font-black text-white">{entity.fields}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <Activity size={12} />
                  <p className="text-[10px] font-mono uppercase tracking-widest">Total Rows</p>
                </div>
                <p className="text-2xl font-black text-white">{entity.rows}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <Box size={12} />
                  <p className="text-[10px] font-mono uppercase tracking-widest">Layer</p>
                </div>
                <p className="text-2xl font-black text-primary">Unified</p>
              </div>
            </div>

            <div className="flex justify-between items-center relative z-10">
              <div className="flex gap-2">
                 <span className="px-2 py-1 bg-white/5 rounded text-[8px] font-mono text-slate-500">PARQUET</span>
                 <span className="px-2 py-1 bg-white/5 rounded text-[8px] font-mono text-slate-500">AUTO_SYNC</span>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-bold text-white bg-primary/20 hover:bg-primary/40 border border-primary/30 px-6 py-2.5 rounded-lg transition-all active:scale-95 shadow-[0_0_15px_rgba(0,163,255,0.1)]">
                EXPLORE SCHEMA <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Empty State / Add New */}
        <div className="glass-panel p-8 border-dashed border-white/10 flex flex-col items-center justify-center text-center hover:bg-white/[0.01] transition-all group">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:border-primary/30 transition-colors">
            <Plus size={32} className="text-slate-600 group-hover:text-primary transition-colors" />
          </div>
          <h3 className="text-slate-400 font-bold tracking-tight">New Unified Entity</h3>
          <p className="text-slate-600 text-[10px] uppercase tracking-widest mt-2">Aggregate multiple sources into one model</p>
          <button className="mt-8 text-[9px] font-mono text-slate-500 border border-white/5 px-4 py-2 rounded hover:bg-white/5 transition-colors">INITIATE WIZARD</button>
        </div>
      </div>
    </div>
  );
}

