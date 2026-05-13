'use client'

import { useState, useTransition } from 'react'
import { inviteMember, updateMemberRole, removeMember } from '@/actions/members'
import { useRouter } from 'next/navigation'
import { UserPlus, Trash2, ChevronDown, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

type Member = {
  memberId: string
  userId: string
  joinedAt: string
  fullName: string | null
  avatarUrl: string | null
  role: string | null
}

const ROLE_BADGE: Record<string, string> = {
  gestor:   'bg-primary/10 text-primary border-primary/20',
  analista: 'bg-violet-400/10 text-violet-400 border-violet-400/20',
  operador: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
}

const ROLES = ['gestor', 'analista', 'operador']

export default function TeamClient({
  initialMembers,
  serverError,
}: {
  initialMembers: Member[]
  serverError: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('operador')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function refresh() {
    router.refresh()
  }

  function handleInvite() {
    if (!inviteEmail.trim()) return
    startTransition(async () => {
      const { error } = await inviteMember(inviteEmail.trim(), inviteRole)
      if (error) {
        setFeedback({ type: 'error', msg: error })
      } else {
        setFeedback({ type: 'ok', msg: `Convite enviado para ${inviteEmail}` })
        setInviteEmail('')
        setShowInvite(false)
        refresh()
      }
    })
  }

  function handleRoleChange(memberId: string, role: string) {
    startTransition(async () => {
      const { error } = await updateMemberRole(memberId, role)
      if (error) setFeedback({ type: 'error', msg: error })
      else refresh()
    })
  }

  function handleRemove(memberId: string, name: string | null) {
    if (!confirm(`Remover ${name ?? 'membro'} da empresa?`)) return
    startTransition(async () => {
      const { error } = await removeMember(memberId)
      if (error) setFeedback({ type: 'error', msg: error })
      else refresh()
    })
  }

  return (
    <div className="space-y-5">
      {/* Feedback banner */}
      {feedback && (
        <div className={`glass-panel p-3 flex items-center gap-3 ${
          feedback.type === 'ok' ? 'border-emerald-500/20' : 'border-red-500/20'
        }`}>
          {feedback.type === 'ok'
            ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            : <XCircle size={15} className="text-red-400 shrink-0" />
          }
          <span className={`text-sm ${feedback.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
            {feedback.msg}
          </span>
          <button onClick={() => setFeedback(null)} className="ml-auto text-slate-500 hover:text-slate-300 text-xs">✕</button>
        </div>
      )}

      {/* Header action */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowInvite(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <UserPlus size={14} />
          Convidar membro
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="glass-panel p-5 border-primary/20">
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-4">Convidar por email</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="email"
              placeholder="email@empresa.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary/40"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <button
              onClick={() => setShowInvite(false)}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleInvite}
              disabled={isPending || !inviteEmail.trim()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending && <Loader2 size={13} className="animate-spin" />}
              Enviar convite
            </button>
          </div>
        </div>
      )}

      {/* Server error */}
      {serverError && !initialMembers.length && (
        <div className="glass-panel p-5 text-red-400 text-sm">{serverError}</div>
      )}

      {/* Member list */}
      <div className="glass-panel overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 grid grid-cols-12 text-[10px] font-mono uppercase tracking-widest text-slate-600">
          <span className="col-span-5">Membro</span>
          <span className="col-span-3">Papel</span>
          <span className="col-span-3">Desde</span>
          <span className="col-span-1" />
        </div>

        {initialMembers.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-600 text-sm">
            Nenhum membro cadastrado. Convide alguém acima.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {initialMembers.map(m => (
              <div key={m.memberId} className="px-5 py-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition-colors">
                <div className="col-span-5">
                  <p className="text-sm text-slate-200 font-medium">{m.fullName ?? '—'}</p>
                  <p className="text-[10px] text-slate-600 font-mono">{m.userId.slice(0, 8)}…</p>
                </div>

                <div className="col-span-3">
                  <div className="relative inline-block">
                    <select
                      defaultValue={m.role ?? 'operador'}
                      onChange={e => handleRoleChange(m.memberId, e.target.value)}
                      disabled={isPending}
                      className={`appearance-none text-[10px] font-mono uppercase tracking-wider px-2 py-1 pr-5 rounded-full border bg-transparent cursor-pointer disabled:opacity-50 ${ROLE_BADGE[m.role ?? 'operador'] ?? 'text-slate-400 border-white/10'}`}
                    >
                      {ROLES.map(r => <option key={r} value={r} className="bg-[#0A0C10]">{r}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                  </div>
                </div>

                <div className="col-span-3 text-[11px] text-slate-600">
                  {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('pt-BR') : '—'}
                </div>

                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => handleRemove(m.memberId, m.fullName)}
                    disabled={isPending}
                    className="p-1.5 rounded text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                    title="Remover membro"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
