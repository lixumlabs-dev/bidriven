import { getTeamMembers } from '@/actions/members'
import { Users } from 'lucide-react'
import TeamClient from './TeamClient'

export default async function GestorTeamPage() {
  const { data: members, error } = await getTeamMembers()

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center border border-primary/30">
            <Users size={16} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Equipe <span className="text-primary">BiDriven</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
          {members?.length ?? 0} membros · Gerencie papéis e acessos
        </p>
      </div>

      <TeamClient initialMembers={members ?? []} serverError={error ?? null} />
    </div>
  )
}
