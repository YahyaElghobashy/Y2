import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/lib/types/database.types"

/**
 * PKCE email-confirmation callback.
 *
 * The free-tier mailer can only send the confirmation LINK (not a 6-digit OTP).
 * That link lands here as {site_url}/auth/callback?code=<uuid>&next=<path>.
 * We exchange the code for a session, attach the auth cookies to the redirect
 * response, and forward the user on. The onboarding guard routes new users from
 * there.
 *
 * NOTE: @supabase/ssr uses the PKCE flow — the code_verifier cookie is written
 * at signUp() time, so the link MUST be opened in the same browser/device the
 * user signed up on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")

  // Only allow relative, single-slash paths to prevent open-redirect abuse.
  const requestedNext = searchParams.get("next") ?? "/"
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/"

  // No code → nothing to exchange. Bounce to login with an error flag.
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // The redirect we attach refreshed auth cookies to on success.
  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  return response
}
