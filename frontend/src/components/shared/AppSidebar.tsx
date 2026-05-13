'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3, Database, GitBranch, Bot, Users, Settings,
  Activity, ClipboardList, LogOut, ChevronRight, Terminal, FileText,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { RoleName } from '@/lib/supabase/types'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_BY_ROLE: Record<RoleName, NavItem[]> = {
  gestor: [
    { label: 'Overview',  href: '/app/gestor/overview',  icon: BarChart3 },
    { label: 'Equipe',    href: '/app/gestor/team',       icon: Users },
    { label: 'Relatórios',href: '/app/gestor/reports',    icon: Database },
    { label: 'Configurações', href: '/app/gestor/settings', icon: Settings },
  ],
  analista: [
    { label: 'Workbench',   href: '/app/analista/workbench',  icon: GitBranch },
    { label: 'Formulários', href: '/app/analista/forms',      icon: FileText  },
    { label: 'Catálogo',    href: '/app/analista/catalog',    icon: Database  },
    { label: 'Dashboards',  href: '/app/analista/dashboards', icon: BarChart3 },
    { label: 'Agentes IA',  href: '/app/analista/agents',     icon: Bot       },
  ],
  operador: [
    { label: 'Monitor',      href: '/app/operador/monitor',      icon: Activity },
    { label: 'Lançamentos',  href: '/app/operador/lancamentos',  icon: ClipboardList },
  ],
}

const ROLE_LABEL: Record<RoleName, string> = {
  gestor:   'Gestor',
  analista: 'Analista',
  operador: 'Operador',
}

const ROLE_COLOR: Record<RoleName, string> = {
  gestor:   'text-primary',
  analista: 'text-violet-400',
  operador: 'text-emerald-400',
}

interface AppSidebarProps {
  role: RoleName
  companyName: string
  userName: string
}

export default function AppSidebar({ role, companyName, userName }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [loggingOut, setLoggingOut] = useState(false)

  const navItems = NAV_BY_ROLE[role]

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#080A0E] border-r border-white/5">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Terminal size={14} className="text-primary" />
          <span className="text-lg font-black tracking-tighter text-white">
            BI<span className="text-primary">DRIVEN</span>
          </span>
        </div>
        <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest pl-5">
          {companyName}
        </p>
      </div>

      {/* Role badge */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={`text-[9px] font-mono font-bold uppercase tracking-widest ${ROLE_COLOR[role]}`}>
            ● {ROLE_LABEL[role]}
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 truncate">{userName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group ${
                active
                  ? 'bg-primary/10 border border-primary/20 text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  size={15}
                  className={active ? 'text-primary' : 'text-slate-600 group-hover:text-slate-400'}
                />
                <span className="font-medium">{item.label}</span>
              </div>
              {active && <ChevronRight size={12} className="text-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <button
          onClick={() => router.push('/select-company')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.03] text-sm transition-all"
        >
          <Settings size={15} />
          <span>Trocar empresa</span>
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/[0.05] text-sm transition-all disabled:opacity-50"
        >
          <LogOut size={15} />
          <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  )
}
