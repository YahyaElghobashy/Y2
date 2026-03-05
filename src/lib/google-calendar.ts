import type { SupabaseClient } from "@supabase/supabase-js"

const GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file"

export function getGoogleAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""
  const redirectUri = typeof window !== "undefined"
    ? `${window.location.origin}/api/google-calendar/callback`
    : ""

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function disconnectGoogleCalendar(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({
      google_calendar_refresh_token: null,
      google_calendar_connected_at: null,
    })
    .eq("id", userId)

  return { error: error?.message ?? null }
}
