'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getActiveCompanyId() {
  return (await cookies()).get('active_company_id')?.value ?? null
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

  const userIds = data.map(m => m.user_id)
  const roleIds = data.map(m => m.role_id)

  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds),
    supabase.from('roles').select('id, name').in('id', roleIds),
  ])

  return {
    data: data.map(m => ({
      memberId:  m.id,
      userId:    m.user_id,
      joinedAt:  m.joined_at,
      fullName:  profiles?.find(p => p.id === m.user_id)?.full_name ?? null,
      avatarUrl: profiles?.find(p => p.id === m.user_id)?.avatar_url ?? null,
      role:      roles?.find(r => r.id === m.role_id)?.name ?? null,
    })),
    error: null,
  }
}

export async function inviteMember(email: string, roleName: string) {
  const supabase = await createClient()
  const companyId = await getActiveCompanyId()
  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!companyId || !caller) return { error: 'Não autenticado' }

  // Verifica que o papel é válido
  const { data: role } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single()

  if (!role) return { error: 'Papel inválido' }

  let targetUserId: string

  try {
    const admin = createAdminClient()

    // Tenta convidar (cria novo usuário e envia email)
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { invited_to_company: companyId },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      }
    )

    if (!inviteError && inviteData?.user) {
      targetUserId = inviteData.user.id
    } else if (inviteError?.status === 422) {
      // Usuário já cadastrado — busca pelo email na lista
      const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
      const found = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (!found) return { error: 'Usuário não encontrado. Peça que o usuário se cadastre primeiro.' }
      targetUserId = found.id
    } else {
      return { error: inviteError?.message ?? 'Erro ao convidar usuário' }
    }
  } catch {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY não configurado. Configure nas env vars para habilitar convites.' }
  }

  // Verifica se já é membro
  const { data: existing } = await supabase
    .from('company_members')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('company_id', companyId)
    .single()

  if (existing) return { error: 'Usuário já é membro desta empresa' }

  // Adiciona ao company_members
  const { error: memberError } = await supabase
    .from('company_members')
    .insert({ user_id: targetUserId, company_id: companyId, role_id: role.id })

  if (memberError) return { error: memberError.message }

  // Notifica o novo membro (se já tinha conta)
  await supabase.from('notifications').insert({
    company_id: companyId,
    user_id:    targetUserId,
    type:       'invite_received',
    title:      'Você foi adicionado a uma empresa',
    message:    `Você agora é membro com o papel de "${roleName}".`,
    metadata:   { company_id: companyId, role: roleName, invited_by: caller.id },
  })

  revalidatePath('/app/gestor/team')
  return { error: null }
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
