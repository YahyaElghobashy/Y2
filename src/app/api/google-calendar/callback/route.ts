import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ""
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  // User denied or error from Google
  if (error || !code) {
    return NextResponse.redirect(`${origin}/more?gcal=error`)
  }

  const redirectUri = `${origin}/api/google-calendar/callback`

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(`${origin}/more?gcal=error`)
    }

    const tokens = await tokenResponse.json()
    const refreshToken = tokens.refresh_token

    if (!refreshToken) {
      return NextResponse.redirect(`${origin}/more?gcal=error`)
    }

    // Get the authenticated user from the session cookie
    const { createServerClient } = await import("@supabase/ssr")
    const supabase = createServerClient(
      SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          setAll(_cookies) {
            // Read-only in this context
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${origin}/more?gcal=error`)
    }

    // Store refresh token using service role client (bypasses RLS)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    // Store token for both Calendar and Drive (combined OAuth scope)
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        google_calendar_refresh_token: refreshToken,
        google_calendar_connected_at: new Date().toISOString(),
        google_drive_refresh_token: refreshToken,
        google_drive_connected_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.redirect(`${origin}/more?gcal=error`)
    }

    return NextResponse.redirect(`${origin}/more?gcal=connected`)
  } catch {
    return NextResponse.redirect(`${origin}/more?gcal=error`)
  }
}
