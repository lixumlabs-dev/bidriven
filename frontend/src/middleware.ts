import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { RoleName } from '@/lib/supabase/types'

const ROLE_HOME: Record<RoleName, string> = {
  gestor:   '/app/gestor/overview',
  analista: '/app/analista/workbench',
  operador: '/app/operador/monitor',
}

const ROLE_PREFIXES: Record<RoleName, string> = {
  gestor:   '/app/gestor',
  analista: '/app/analista',
  operador: '/app/operador',
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Rotas públicas
  if (pathname === '/' || pathname.startsWith('/auth')) {
    if (user && pathname === '/') {
      const role = await getUserRole(supabase, request, user.id)
      if (role) return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
      return NextResponse.redirect(new URL('/select-company', request.url))
    }
    return supabaseResponse
  }

  // Rotas protegidas — exige sessão
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /select-company — logado, qualquer papel
  if (pathname === '/select-company') {
    return supabaseResponse
  }

  // Rotas /app/* — valida papel
  if (pathname.startsWith('/app/')) {
    const role = await getUserRole(supabase, request, user.id)

    if (!role) {
      return NextResponse.redirect(new URL('/select-company', request.url))
    }

    const allowedPrefix = ROLE_PREFIXES[role]
    if (!pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
    }
  }

  return supabaseResponse
}

async function getUserRole(
  supabase: ReturnType<typeof createServerClient>,
  request: NextRequest,
  userId: string
): Promise<RoleName | null> {
  const companyId = request.cookies.get('active_company_id')?.value ?? null

  if (!companyId) {
    const { data } = await supabase
      .from('company_members')
      .select('role:roles(name)')
      .eq('user_id', userId)
      .limit(1)
      .single()

    return (data?.role as { name: RoleName } | null)?.name ?? null
  }

  const { data } = await supabase
    .from('company_members')
    .select('role:roles(name)')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .single()

  return (data?.role as { name: RoleName } | null)?.name ?? null
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
