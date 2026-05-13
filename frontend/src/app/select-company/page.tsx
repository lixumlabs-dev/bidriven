'use client'

import React, { useEffect, useState } from 'react'
import { Building2, ChevronRight, LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { RoleName } from '@/lib/supabase/types'

interface CompanyOption {
  memberId: string
  companyId: string
  companyName: string
  role: RoleName
}

const ROLE_HOME: Record<RoleName, string> = {
  gestor:   '/app/gestor/overview',
  analista: '/app/analista/workbench',
  operador: '/app/operador/monitor',
}

const ROLE_LABEL: Record<RoleName, string> = {
  gestor:   'Gestor',
  analista: 'Analista',
  operador: 'Operador',
}

const ROLE_COLOR: Record<RoleName, string> = {
  gestor:   'text-primary border-primary/30 bg-primary/10',
  analista: 'text-violet-400 border-violet-400/30 bg-violet-400/10',
  operador: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
}

export default function SelectCompanyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      setUserName(user.user_metadata?.full_name ?? user.email ?? '')

      const { data: members } = await supabase
        .from('company_members')
        .select('id, company_id, role_id')
        .eq('user_id', user.id)

      if (members && members.length > 0) {
        const companyIds = members.map((m) => m.company_id)
        const roleIds    = members.map((m) => m.role_id)

        const [{ data: companies }, { data: roles }] = await Promise.all([
          supabase.from('companies').select('id, name').in('id', companyIds),
          supabase.from('roles').select('id, name').in('id', roleIds),
        ])

        setCompanies(
          members.map((m) => ({
            memberId:    m.id,
            companyId:   m.company_id,
            companyName: companies?.find((c) => c.id === m.company_id)?.name ?? '—',
            role:        (roles?.find((r) => r.id === m.role_id)?.name ?? 'operador') as RoleName,
          }))
        )
      }

      setLoading(false)
    }
    load()
  }, [])

  async function selectCompany(option: CompanyOption) {
    setSelecting(option.companyId)
    // Armazena empresa ativa em cookie via server action
    document.cookie = `active_company_id=${option.companyId}; path=/; max-age=86400`
    router.push(ROLE_HOME[option.role])
    router.refresh()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-lg px-6 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tighter text-white mb-2">
            BI<span className="text-primary">DRIVEN</span>
          </h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.2em]">
            Selecione a empresa
          </p>
        </div>

        <div className="glass-panel p-8 relative">
          <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {userName && (
            <p className="text-[11px] text-slate-500 font-mono mb-6">
              Logado como <span className="text-slate-300">{userName}</span>
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={40} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 text-sm font-medium mb-1">Nenhuma empresa vinculada</p>
              <p className="text-slate-600 text-xs">Entre em contato com o administrador da plataforma.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((option) => (
                <button
                  key={option.companyId}
                  onClick={() => selectCompany(option)}
                  disabled={!!selecting}
                  data-testid={`company-${option.companyId}`}
                  className="w-full flex items-center justify-between p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/8 hover:border-primary/30 rounded-xl transition-all group disabled:opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building2 size={20} className="text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{option.companyName}</p>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${ROLE_COLOR[option.role]}`}>
                        {ROLE_LABEL[option.role]}
                      </span>
                    </div>
                  </div>

                  {selecting === option.companyId ? (
                    <Loader2 size={16} className="text-primary animate-spin" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full flex items-center justify-center gap-2 text-slate-600 hover:text-slate-400 text-[11px] font-mono uppercase tracking-widest transition-colors py-3"
        >
          <LogOut size={12} />
          Sair da conta
        </button>
      </div>
    </main>
  )
}
