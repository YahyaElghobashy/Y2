"use server"

import { cookies } from "next/headers"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function verifyPortalPassword(
  portalId: string,
  password: string
): Promise<{ success: boolean }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await getSupabaseServerClient()) as any

  const { data: portal } = await supabase
    .from("event_portals")
    .select("password_hash")
    .eq("id", portalId)
    .single()

  if (!portal?.password_hash) return { success: false }

  // Hash the provided password with SHA-256 (same method used when setting)
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password))
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  if (hashHex !== portal.password_hash) return { success: false }

  // Set auth cookie (24h)
  const cookieStore = await cookies()
  cookieStore.set(`portal_auth_${portalId}`, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  })

  return { success: true }
}
