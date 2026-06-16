import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// ── Supabase server client mock ────────────────────────────
const getUser = vi.fn()
const single = vi.fn()
const eq = vi.fn(() => ({ single }))
const select = vi.fn(() => ({ eq }))
const from = vi.fn(() => ({ select }))
const getPublicUrl = vi.fn(() => ({ data: { publicUrl: "https://storage.example/snap-photos/x.webp" } }))
const storageFrom = vi.fn(() => ({ getPublicUrl }))

const client = {
  auth: { getUser },
  from,
  storage: { from: storageFrom },
}
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(async () => client),
}))

import { GET } from "@/app/api/media/[id]/route"

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const req = () => new Request("https://app.example/api/media/m-1")

describe("GET /api/media/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co"
    process.env.MEDIA_PROXY_KEY = "test-secret"
  })
  afterEach(() => {
    delete process.env.MEDIA_PROXY_KEY
  })

  it("400 when id is empty", async () => {
    const res = await GET(req(), ctx(""))
    expect(res.status).toBe(400)
  })

  it("401 when unauthenticated (no <img> can read someone else's media)", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await GET(req(), ctx("m-1"))
    expect(res.status).toBe(401)
  })

  it("404 when the media row is missing", async () => {
    single.mockResolvedValue({ data: null, error: { message: "no rows" } })
    const res = await GET(req(), ctx("m-1"))
    expect(res.status).toBe(404)
  })

  it("302-redirects active media to its public Storage URL", async () => {
    single.mockResolvedValue({
      data: { status: "active", storage_bucket: "snap-photos", storage_path: "u/x.webp", google_drive_file_id: null },
      error: null,
    })
    const res = await GET(req(), ctx("m-1"))
    expect(res.status).toBe(302)
    expect(storageFrom).toHaveBeenCalledWith("snap-photos")
    expect(res.headers.get("location")).toBe("https://storage.example/snap-photos/x.webp")
  })

  it("302-redirects exported media to a signed, short-lived proxy URL (id+exp+sig, no raw key)", async () => {
    single.mockResolvedValue({
      data: { status: "exported", storage_bucket: "snap-photos", storage_path: "u/old.webp", google_drive_file_id: "drive-123" },
      error: null,
    })
    const res = await GET(req(), ctx("m-1"))
    expect(res.status).toBe(302)
    const loc = res.headers.get("location") ?? ""
    expect(loc).toContain("/functions/v1/media-proxy")
    expect(loc).toContain("id=m-1")
    expect(loc).toContain("exp=")
    expect(loc).toContain("sig=")
    expect(loc).not.toContain("test-secret")
  })

  it("500 (never an open proxy) when MEDIA_PROXY_KEY is missing for exported media", async () => {
    delete process.env.MEDIA_PROXY_KEY
    single.mockResolvedValue({
      data: { status: "exported", storage_bucket: "snap-photos", storage_path: "u/old.webp", google_drive_file_id: "drive-123" },
      error: null,
    })
    const res = await GET(req(), ctx("m-1"))
    expect(res.status).toBe(500)
  })

  it("404 when media is neither active nor exported (e.g. export_failed)", async () => {
    single.mockResolvedValue({
      data: { status: "export_failed", storage_bucket: null, storage_path: null, google_drive_file_id: null },
      error: null,
    })
    const res = await GET(req(), ctx("m-1"))
    expect(res.status).toBe(404)
  })
})
