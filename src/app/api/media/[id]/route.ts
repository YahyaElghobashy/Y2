// ============================================================
// GET /api/media/[id]
//
// Auth-gated resolver for media that an <img> can hit directly (cookies ride
// along on same-origin image requests, so the Supabase session authenticates
// the caller — no JWT in the URL, no static key in the client bundle).
//
//   active   media → 302 to the public Storage URL
//   exported media → 302 to a short-lived, HMAC-signed media-proxy URL
//
// Unauthenticated callers get 401; unknown / unavailable media get 404.
// ============================================================

import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { buildSignedProxyUrl } from "@/lib/media/signed-url"

// HMAC signing needs node:crypto — keep this handler on the Node runtime.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  // ── Auth gate ──────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Resolve the media row (RLS-scoped to the couple) ───────
  const { data: media, error } = await supabase
    .from("media_files")
    .select("status, storage_bucket, storage_path, google_drive_file_id")
    .eq("id", id)
    .single()

  if (error || !media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // ── Active → public Storage URL ────────────────────────────
  if (media.status === "active" && media.storage_bucket && media.storage_path) {
    const { data } = supabase.storage
      .from(media.storage_bucket)
      .getPublicUrl(media.storage_path)
    return NextResponse.redirect(data.publicUrl, { status: 302 })
  }

  // ── Exported → signed, short-lived proxy URL ───────────────
  if (media.status === "exported" && media.google_drive_file_id) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return NextResponse.json({ error: "Proxy not configured" }, { status: 500 })
    }
    try {
      const signed = buildSignedProxyUrl(supabaseUrl, id)
      return NextResponse.redirect(signed, { status: 302 })
    } catch {
      // MEDIA_PROXY_KEY missing — never fall through to an open proxy.
      return NextResponse.json({ error: "Proxy not configured" }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Media not available" }, { status: 404 })
}
