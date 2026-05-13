'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

function getActiveCompanyId() {
  return cookies().then(c => c.get('active_company_id')?.value ?? null)
}

export async function getTeamMembers() {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { data: null, error: 'Nenhuma empresa ativa' }

  const { data, error } = await supabase
    .from('company_members')
    .select('id, user_id, role_id, joined_at')
    .eq('company_id', companyId)

  if (error || !data) return { data: null, error: error?.message }

  const userIds  = data.map(m => m.user_id)
  const roleIds  = data.map(m => m.role_id)

  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds),
    supabase.from('roles').select('id, name').in('id', roleIds),
  ])

  return {
    data: data.map(m => ({
      memberId:   m.id,
      userId:     m.user_id,
      joinedAt:   m.joined_at,
      fullName:   profiles?.find(p => p.id === m.user_id)?.full_name ?? null,
      avatarUrl:  profiles?.find(p => p.id === m.user_id)?.avatar_url ?? null,
      role:       roles?.find(r => r.id === m.role_id)?.name ?? null,
    })),
    error: null,
  }
}

export async function inviteMember(email: string, roleName: string) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { error: 'Nenhuma empresa ativa' }

  // Busca usuário pelo email
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('id',
      supabase
        .from('profiles')
        .select('id')
        .limit(1) as unknown as string
    )
    .limit(1)

  // Alternativa: buscar via auth.users (requer service role — feito via API route separada)
  // Por ora retorna instrução para o usuário se cadastrar primeiro
  void users
  return { error: 'Use o SQL Editor para vincular o usuário manualmente até implementarmos o convite por email.' }
}

export async function updateMemberRole(memberId: string, newRoleName: string) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { error: 'Nenhuma empresa ativa' }

  const { data: role } = await supabase
    .from('roles')
    .select('id')
    .eq('name', newRoleName)
    .single()

  if (!role) return { error: 'Papel inválido' }

  const { error } = await supabase
    .from('company_members')
    .update({ role_id: role.id })
    .eq('id', memberId)
    .eq('company_id', companyId)

  if (error) return { error: error.message }
  revalidatePath('/app/gestor/team')
  return { error: null }
}

export async function removeMember(memberId: string) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  if (!companyId) return { error: 'Nenhuma empresa ativa' }

  const { error } = await supabase
    .from('company_members')
    .delete()
    .eq('id', memberId)
    .eq('company_id', companyId)

  if (error) return { error: error.message }
  revalidatePath('/app/gestor/team')
  return { error: null }
}
