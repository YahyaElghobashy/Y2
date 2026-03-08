import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PROTECTED_PREFIXES = ["/", "/us", "/health", "/spirit", "/ops", "/settings"]

function isProtectedRoute(pathname: string): boolean {
  // Allow unauthenticated access to public routes
  if (pathname.startsWith("/e")) return false
  if (pathname.startsWith("/pair")) return false
  if (pathname === "/") return true
  return PROTECTED_PREFIXES.some(
    (prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(prefix + "/"))
  )
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
