import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// DEFAULT-PROTECT: every route requires a session UNLESS it matches the public
// allowlist below. The previous explicit PROTECTED_PREFIXES list silently left
// /me, /treasury, /keepsake, /snap, /garden, /game/*, /our-table, /more, /2026,
// /create-coupon, /onboarding (everything not enumerated) reachable logged-out.
//
// Public surfaces:
//  - (auth) screens: /login, /forgot-password, /reset-password
//  - /auth/* : the PKCE callback must run WITHOUT a session (it creates one)
//  - /e/*    : the shareable public event portal
//  - /offline: the PWA offline fallback page
//  - /preview: the local design/preview harness (kept per project guardrails)
const PUBLIC_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/e",
  "/offline",
  "/preview",
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  )
}

function isProtectedRoute(pathname: string): boolean {
  return !isPublicRoute(pathname)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    const { response, user } = await updateSession(request)

    // Authenticated user on auth pages → redirect to home
    // Note: /reset-password is excluded — user arrives authenticated via recovery flow
    if (user && (pathname === "/login" || pathname === "/forgot-password")) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Unauthenticated user on protected route → redirect to login
    if (!user && isProtectedRoute(pathname)) {
      const url = new URL("/login", request.url)
      url.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(url)
    }

    return response
  } catch {
    // Fail-closed: redirect to login on auth error for protected routes
    if (isProtectedRoute(pathname)) {
      const url = new URL("/login", request.url)
      url.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
