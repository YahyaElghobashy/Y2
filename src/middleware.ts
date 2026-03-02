import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PROTECTED_PREFIXES = ["/", "/us", "/health", "/spirit", "/ops", "/settings"]

function isProtectedRoute(pathname: string): boolean {
  if (pathname === "/") return true
  return PROTECTED_PREFIXES.some(
    (prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(prefix + "/"))
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    const { response, user } = await updateSession(request)

    // Authenticated user on /login → redirect to home
    if (user && pathname === "/login") {
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
    // Fail-open: if getUser() throws, allow request through
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
