import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Supabase server client mock ────────────────────────────
const getUser = vi.fn()
const single = vi.fn()
const eq = vi.fn(() => ({ single }))
const select = vi.fn(() => ({ eq }))
const from = vi.fn(() => ({ select }))
const client = { auth: { getUser }, from }
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(async () => client),
}))

// NOTE: this test runs against the REAL committed bundle on disk at
// content/trips/cambridge-london/ (UK Trip.dc.html, support.js, screens/wx.png,
// uploads/*.md). That makes it a genuine end-to-end check that the serve route
// resolves the shipped files — and exercises the real path-traversal guard.
import { GET } from "@/app/(main)/travels/[tripId]/site/[[...path]]/route"

const REAL_MD =
  "England in 10 Days_ A First-Timer's Cambridge and London Guide (June 24 - July 4, 2026).md"

const ctx = (tripId: string, p?: string[]) => ({
  params: Promise.resolve({ tripId, path: p }),
})
const req = () => new Request("https://app.example/travels/t1/site")

describe("GET /travels/[tripId]/site/[[...path]]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
    single.mockResolvedValue({
      data: { hosted_path: "cambridge-london", kind: "hosted" },
      error: null,
    })
  })

  // ── Auth ──
  it("400 when tripId is empty", async () => {
    const res = await GET(req(), ctx(""))
    expect(res.status).toBe(400)
  })

  it("401 when unauthenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await GET(req(), ctx("t1"))
    expect(res.status).toBe(401)
  })

  // ── Trip resolution ──
  it("404 when the trip is missing / not visible (RLS)", async () => {
    single.mockResolvedValue({ data: null, error: { message: "no rows" } })
    const res = await GET(req(), ctx("t1"))
    expect(res.status).toBe(404)
  })

  it("404 when the trip is not a hosted trip", async () => {
    single.mockResolvedValue({
      data: { hosted_path: null, kind: "native" },
      error: null,
    })
    const res = await GET(req(), ctx("t1"))
    expect(res.status).toBe(404)
  })

  it("queries the trips table by id (RLS-scoped)", async () => {
    await GET(req(), ctx("t1"))
    expect(from).toHaveBeenCalledWith("trips")
    expect(eq).toHaveBeenCalledWith("id", "t1")
  })

  // ── Default document + real files ──
  it("serves the default document (UK Trip.dc.html) with text/html", async () => {
    const res = await GET(req(), ctx("t1"))
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/html")
    expect(res.headers.get("cache-control")).toBe("private, max-age=3600")
    const body = await res.text()
    expect(body.length).toBeGreaterThan(0)
  })

  it("serves support.js with a javascript content-type", async () => {
    const res = await GET(req(), ctx("t1", ["support.js"]))
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/javascript")
  })

  it("serves a nested png (screens/wx.png) with image/png", async () => {
    const res = await GET(req(), ctx("t1", ["screens", "wx.png"]))
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("image/png")
  })

  it("serves a markdown upload with text/markdown", async () => {
    const res = await GET(req(), ctx("t1", ["uploads", REAL_MD]))
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/markdown")
  })

  // ── Path-traversal guard ──
  it("404s a ../ traversal that escapes the content root", async () => {
    const res = await GET(req(), ctx("t1", ["..", "..", "..", "etc", "passwd"]))
    expect(res.status).toBe(404)
  })

  it("404s an attempt to read a sibling bundle via ..", async () => {
    const res = await GET(req(), ctx("t1", ["..", "other-trip", "secret.html"]))
    expect(res.status).toBe(404)
  })

  // ── Missing / non-file ──
  it("404 when the requested file does not exist", async () => {
    const res = await GET(req(), ctx("t1", ["does-not-exist.html"]))
    expect(res.status).toBe(404)
  })

  it("404 when the path resolves to a directory, not a file", async () => {
    // `screens` and `uploads` are real directories in the bundle.
    const res = await GET(req(), ctx("t1", ["screens"]))
    expect(res.status).toBe(404)
  })

  it("resolves the default doc under the bundle's hosted_path folder", async () => {
    // Sanity: a different bundle key would resolve to a different folder.
    single.mockResolvedValue({
      data: { hosted_path: "nonexistent-bundle", kind: "hosted" },
      error: null,
    })
    const res = await GET(req(), ctx("t1"))
    // The folder doesn't exist on disk → 404, proving the key drives resolution.
    expect(res.status).toBe(404)
  })
})
