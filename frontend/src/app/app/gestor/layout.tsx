import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import AppSidebar from '@/components/shared/AppSidebar'

export default async function GestorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const cookieStore = await cookies()
  const companyId = cookieStore.get('active_company_id')?.value ?? ''

  const { data: member } = await supabase
    .from('company_members')
    .select('role_id, company_id')
    .eq('user_id', user.id)
    .eq('company_id', companyId)
    .single()

  if (!member) redirect('/select-company')

  const [{ data: company }, { data: role }, { data: profile }] = await Promise.all([
    supabase.from('companies').select('name').eq('id', member.company_id).single(),
    supabase.from('roles').select('name').eq('id', member.role_id).single(),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
  ])

  if (role?.name !== 'gestor') redirect('/select-company')

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar
        role="gestor"
        companyName={company?.name ?? '—'}
        userName={profile?.full_name ?? user.email ?? ''}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
