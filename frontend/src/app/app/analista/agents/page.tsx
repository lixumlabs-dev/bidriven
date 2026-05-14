import { getAgentRequests } from '@/actions/agents'
import { Bot } from 'lucide-react'
import AgentsClient from './AgentsClient'

export type AgentRun = {
  id: string
  status: string
  result: { output: string } | null
  started_at: string | null
  finished_at: string | null
  tokens_used: number | null
}

export type AgentRequest = {
  id: string
  agent_type: string
  status: string
  context: Record<string, unknown>
  prompt: string | null
  created_at: string
  runs: AgentRun[]
}

export default async function AnalistaAgentsPage() {
  const { data: requests } = await getAgentRequests()

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-violet-400/20 rounded flex items-center justify-center border border-violet-400/30">
            <Bot size={16} className="text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Agentes <span className="text-violet-400">IA</span>
          </h1>
        </div>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] ml-10">
          Análise automatizada · Insights · Validação
        </p>
      </div>

      <AgentsClient requests={(requests ?? []) as AgentRequest[]} />
    </div>
  )
}
