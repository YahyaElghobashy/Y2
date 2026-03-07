import type { SupabaseClient } from "@supabase/supabase-js"

export async function disconnectGoogleDrive(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({
      google_drive_refresh_token: null,
      google_drive_connected_at: null,
    })
    .eq("id", userId)

  return { error: error?.message ?? null }
}
