// ============================================================
// GET /travels/[tripId]/site/[[...path]]
//
// Auth-gated static-file server for a "hosted" trip — a self-contained static
// bundle (HTML + JS + images + markdown) that ships in the app repo under
// content/trips/<key>/ and must NOT be public. Relative refs in the bundle
// (./support.js, screens/wx.png, uploads/*.md) resolve because the browser's
// base URL is /travels/<id>/site/.
//
// Flow:
//   401 — no Supabase session (middleware already protects /travels; this is
//         defense-in-depth so the bundle never leaks even if routing changes)
//   404 — trip not found, not visible (RLS), or not a hosted trip
//   404 — requested file missing OR escapes the content root (traversal guard)
//   200 — stream the file with the right Content-Type, private cache
//
// Mirrors the auth+stream style of src/app/api/media/[id]/route.ts.
// ============================================================

import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// fs + path need the Node runtime; the bundle is per-user gated so never cache
// the route output itself.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Absolute root the bundles live under. process.cwd() is the app root both in
// `next dev` and in the serverless bundle (see outputFileTracingIncludes in
// next.config.ts, which ships content/trips/** alongside this route).
const CONTENT_ROOT = path.join(process.cwd(), "content", "trips")

// The default document when no file is requested.
const DEFAULT_FILE = "UK Trip.dc.html"

// Minimal, explicit extension → Content-Type map. Unknown types fall back to
// octet-stream so we never guess-execute something.
const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
}

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return CONTENT_TYPES[ext] ?? "application/octet-stream"
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string; path?: string[] }> }
) {
  const { tripId, path: segments } = await params

  if (!tripId) {
    return NextResponse.json({ error: "tripId required" }, { status: 400 })
  }

  // ── Auth gate (defense-in-depth) ───────────────────────────
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Resolve the trip (RLS-scoped to owner + partner) ───────
  const { data: trip, error } = await supabase
    .from("trips")
    .select("hosted_path, kind")
    .eq("id", tripId)
    .single()

  if (error || !trip || trip.kind !== "hosted" || !trip.hosted_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // The trip's bundle folder key (e.g. "cambridge-london").
  const dir = trip.hosted_path

  // The requested file relative to the bundle, or the default document.
  const requested = (segments ?? []).join("/") || DEFAULT_FILE

  // ── Resolve + path-traversal guard ─────────────────────────
  // Build the bundle root, then the resolved target, and require the target to
  // stay inside its own bundle. Guards against ../ escapes and absolute paths.
  const bundleRoot = path.resolve(CONTENT_ROOT, dir)
  const resolved = path.resolve(bundleRoot, requested)

  if (resolved !== bundleRoot && !resolved.startsWith(bundleRoot + path.sep)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // ── Read + stream ──────────────────────────────────────────
  let file: Buffer
  try {
    const stat = await fs.stat(resolved)
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    file = await fs.readFile(resolved)
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": contentTypeFor(resolved),
      // Private (per-user gated) but cacheable in the browser for an hour.
      "Cache-Control": "private, max-age=3600",
    },
  })
}
