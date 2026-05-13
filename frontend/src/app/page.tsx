'use client'

import React, { useState } from 'react'
import { Lock, Mail, ChevronRight, Terminal, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciais inválidas. Verifique e-mail e senha.')
      setLoading(false)
      return
    }

    router.push('/select-company')
    router.refresh()
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('Erro ao conectar com Google. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background cyber accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <Terminal size={12} className="text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
              System Auth v1.0
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2">
            BI<span className="text-primary">DRIVEN</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em]">
            Enterprise Unified Data Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative">
          <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 ml-1">
                Operator ID
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors"
                  size={16}
                />
                <input
                  type="email"
                  placeholder="name@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  data-testid="login-email"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 ml-1">
                Access Token
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors"
                  size={16}
                />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  data-testid="login-password"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-[11px] font-mono text-center bg-red-500/10 border border-red-500/20 rounded-lg py-3 px-4">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit"
              className="w-full bg-primary hover:bg-blue-500 text-white font-bold py-4 rounded-lg shadow-[0_0_30px_rgba(0,163,255,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="font-mono text-sm tracking-widest">AUTENTICANDO...</span>
              ) : (
                <>
                  ESTABLISH CONNECTION
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            data-testid="login-google"
            className="w-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 text-slate-300 font-medium py-4 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Globe size={16} className="text-slate-400" />
            <span className="text-sm">Continuar com Google</span>
          </button>

          {/* Status bar */}
          <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(0,163,255,0.8)]" />
              <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                Cloud Node: Active
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-700">SSL_TLS_1.3</span>
          </div>
        </div>

        <p className="text-center mt-10 text-slate-600 text-[10px] uppercase tracking-widest">
          Secured by <span className="text-slate-400">BiDriven Intelligence</span>
        </p>
      </div>
    </main>
  )
}
