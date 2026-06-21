import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Routes that require the user to be logged OUT (redirect to /dashboard if logged in)
const AUTH_ROUTES = ['/login', '/signup', '/register']

// Routes that are fully public — no auth check at all
const PUBLIC_ROUTES = ['/pricing', '/payment', '/api/']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isAuthRoute   = AUTH_ROUTES.some(r => pathname.startsWith(r))
  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  // Fully public — no auth logic
  if (isPublicRoute) return response

  // Logged-in user visiting /login or /signup → redirect to dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Guest visiting a protected route → redirect to login
  if (!user && !isAuthRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
