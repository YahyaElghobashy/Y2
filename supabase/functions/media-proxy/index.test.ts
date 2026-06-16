// ============================================================
// TF07 / W4: Media Proxy Edge Function Tests
// Mirrors the signed (HMAC) auth scheme + private, TTL-bounded cache of index.ts.
// ============================================================

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

// ── Mock State ──────────────────────────────────────────────

let mockMediaRow: Record<string, unknown> | null = null;
let mockMediaError: unknown = null;
let mockTokenOwner: Record<string, unknown> | null = null;
let mockTokenRefreshOk = true;
let mockDriveFetchOk = true;

const SECRET = "test-proxy-secret";

// ── Signing helper (identical algorithm to index.ts) ────────

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signToken(id: string, exp: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${exp}`),
  );
  return base64url(new Uint8Array(mac));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── Mock Supabase ───────────────────────────────────────────

function createMockSupabase() {
  return {
    from: (table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: string) => ({
          single: () =>
            Promise.resolve({
              data: table === "media_files" ? mockMediaRow : null,
              error: table === "media_files" ? mockMediaError : null,
            }),
        }),
        not: (_col: string, _op: string, _val: unknown) => ({
          limit: (_n: number) => ({
            single: () =>
              Promise.resolve({ data: mockTokenOwner, error: null }),
          }),
        }),
      }),
    }),
  };
}

// ── Mock Fetch ──────────────────────────────────────────────

const _originalFetch = globalThis.fetch;

function setupMockFetch() {
  globalThis.fetch = (async (
    input: string | URL | Request,
    _init?: RequestInit
  ) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("oauth2.googleapis.com/token")) {
      if (!mockTokenRefreshOk) return new Response("error", { status: 400 });
      return new Response(JSON.stringify({ access_token: "mock-access-token" }), { status: 200 });
    }
    if (url.includes("googleapis.com/drive/v3/files/") && url.includes("alt=media")) {
      if (!mockDriveFetchOk) return new Response("not found", { status: 404 });
      return new Response(new Blob(["image-data"], { type: "image/webp" }), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

function restoreFetch() {
  globalThis.fetch = _originalFetch;
}

// ── Simulate Handler (mirrors index.ts auth + cache) ────────

async function simulateHandler(params: {
  mediaId?: string | null;
  exp?: string | null;
  sig?: string | null;
  secret?: string;
  nowSeconds?: number;
}): Promise<{ status: number; data?: Record<string, unknown>; contentType?: string; cacheControl?: string }> {
  const { mediaId, exp, sig, secret = SECRET, nowSeconds = Math.floor(Date.now() / 1000) } = params;

  if (!mediaId) return { status: 400, data: { error: "id parameter required" } };
  if (!exp || !sig) return { status: 401, data: { error: "Unauthorized" } };
  if (!secret) return { status: 500, data: { error: "Proxy not configured" } };

  const expSeconds = Number(exp);
  if (!Number.isFinite(expSeconds) || expSeconds < nowSeconds) {
    return { status: 401, data: { error: "Link expired" } };
  }

  const expectedSig = await signToken(mediaId, exp, secret);
  if (!timingSafeEqual(expectedSig, sig)) {
    return { status: 401, data: { error: "Unauthorized" } };
  }

  const supabase = createMockSupabase();
  const { data: media, error: dbErr } = await supabase
    .from("media_files")
    .select("google_drive_file_id, content_type, status")
    .eq("id", mediaId)
    .single();

  if (dbErr || !media) return { status: 404, data: { error: "Media not found" } };
  if (media.status !== "exported" || !media.google_drive_file_id) {
    return { status: 404, data: { error: "Media not available for proxy" } };
  }

  const { data: tokenOwnerData } = await supabase
    .from("profiles")
    .select("google_drive_refresh_token")
    .not("google_drive_refresh_token", "is", null)
    .limit(1)
    .single();

  if (!tokenOwnerData?.google_drive_refresh_token) {
    return { status: 503, data: { error: "No Drive connection" } };
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ refresh_token: tokenOwnerData.google_drive_refresh_token as string, grant_type: "refresh_token" }),
  });
  if (!tokenRes.ok) return { status: 503, data: { error: "Token refresh failed" } };
  const tokenData = await tokenRes.json();

  const driveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${media.google_drive_file_id}?alt=media`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  if (!driveRes.ok) return { status: 502, data: { error: "Drive fetch failed" } };

  const maxAge = Math.max(0, expSeconds - nowSeconds);
  return {
    status: 200,
    contentType: (media.content_type as string) || "image/webp",
    cacheControl: `private, max-age=${maxAge}`,
  };
}

// ── Helpers ─────────────────────────────────────────────────

function resetMocks() {
  mockMediaRow = null;
  mockMediaError = null;
  mockTokenOwner = null;
  mockTokenRefreshOk = true;
  mockDriveFetchOk = true;
}

const NOW = 1_000_000;
const FUTURE = String(NOW + 3600);

async function validSig(mediaId: string, exp = FUTURE): Promise<string> {
  return await signToken(mediaId, exp, SECRET);
}

// ── Tests ───────────────────────────────────────────────────

Deno.test("returns 400 when id parameter is missing", async () => {
  resetMocks();
  const result = await simulateHandler({ mediaId: null, exp: FUTURE, sig: "x", nowSeconds: NOW });
  assertEquals(result.status, 400);
  assertEquals(result.data?.error, "id parameter required");
});

Deno.test("returns 401 when signature/exp are missing", async () => {
  resetMocks();
  const result = await simulateHandler({ mediaId: "abc", exp: null, sig: null, nowSeconds: NOW });
  assertEquals(result.status, 401);
  assertEquals(result.data?.error, "Unauthorized");
});

Deno.test("returns 401 when the signature is wrong", async () => {
  resetMocks();
  const result = await simulateHandler({ mediaId: "abc", exp: FUTURE, sig: "forged-signature", nowSeconds: NOW });
  assertEquals(result.status, 401);
  assertEquals(result.data?.error, "Unauthorized");
});

Deno.test("returns 401 when the link is expired", async () => {
  resetMocks();
  const past = String(NOW - 1);
  const sig = await validSig("abc", past);
  const result = await simulateHandler({ mediaId: "abc", exp: past, sig, nowSeconds: NOW });
  assertEquals(result.status, 401);
  assertEquals(result.data?.error, "Link expired");
});

Deno.test("returns 500 when the signing secret is not configured", async () => {
  resetMocks();
  const result = await simulateHandler({ mediaId: "abc", exp: FUTURE, sig: "x", secret: "", nowSeconds: NOW });
  assertEquals(result.status, 500);
});

Deno.test("returns 404 when media_files row not found", async () => {
  resetMocks();
  mockMediaRow = null;
  mockMediaError = { message: "not found" };
  const result = await simulateHandler({ mediaId: "abc", exp: FUTURE, sig: await validSig("abc"), nowSeconds: NOW });
  assertEquals(result.status, 404);
  assertEquals(result.data?.error, "Media not found");
});

Deno.test("returns 404 when status is not exported", async () => {
  resetMocks();
  mockMediaRow = { google_drive_file_id: null, content_type: "image/webp", status: "active" };
  const result = await simulateHandler({ mediaId: "abc", exp: FUTURE, sig: await validSig("abc"), nowSeconds: NOW });
  assertEquals(result.status, 404);
  assertEquals(result.data?.error, "Media not available for proxy");
});

Deno.test("returns 503 when no Drive token is available", async () => {
  resetMocks();
  setupMockFetch();
  try {
    mockMediaRow = { google_drive_file_id: "drive-id", content_type: "image/webp", status: "exported" };
    mockTokenOwner = null;
    const result = await simulateHandler({ mediaId: "abc", exp: FUTURE, sig: await validSig("abc"), nowSeconds: NOW });
    assertEquals(result.status, 503);
    assertEquals(result.data?.error, "No Drive connection");
  } finally {
    restoreFetch();
  }
});

Deno.test("returns 503 when token refresh fails", async () => {
  resetMocks();
  setupMockFetch();
  try {
    mockMediaRow = { google_drive_file_id: "drive-id", content_type: "image/webp", status: "exported" };
    mockTokenOwner = { google_drive_refresh_token: "bad-token" };
    mockTokenRefreshOk = false;
    const result = await simulateHandler({ mediaId: "abc", exp: FUTURE, sig: await validSig("abc"), nowSeconds: NOW });
    assertEquals(result.status, 503);
    assertEquals(result.data?.error, "Token refresh failed");
  } finally {
    restoreFetch();
  }
});

Deno.test("returns 502 when Drive fetch fails", async () => {
  resetMocks();
  setupMockFetch();
  try {
    mockMediaRow = { google_drive_file_id: "drive-id", content_type: "image/webp", status: "exported" };
    mockTokenOwner = { google_drive_refresh_token: "good-token" };
    mockDriveFetchOk = false;
    const result = await simulateHandler({ mediaId: "abc", exp: FUTURE, sig: await validSig("abc"), nowSeconds: NOW });
    assertEquals(result.status, 502);
    assertEquals(result.data?.error, "Drive fetch failed");
  } finally {
    restoreFetch();
  }
});

Deno.test("successful proxy returns content type and a PRIVATE, TTL-bounded cache", async () => {
  resetMocks();
  setupMockFetch();
  try {
    mockMediaRow = { google_drive_file_id: "drive-id-123", content_type: "image/webp", status: "exported" };
    mockTokenOwner = { google_drive_refresh_token: "good-token" };
    const result = await simulateHandler({ mediaId: "abc", exp: FUTURE, sig: await validSig("abc"), nowSeconds: NOW });
    assertEquals(result.status, 200);
    assertEquals(result.contentType, "image/webp");
    assertExists(result.cacheControl);
    // Must be PRIVATE (no shared-cache reuse) and never outlive the signature.
    assertEquals(result.cacheControl!.startsWith("private,"), true);
    assertEquals(result.cacheControl!.includes("public"), false);
    assertEquals(result.cacheControl, "private, max-age=3600");
  } finally {
    restoreFetch();
  }
});

Deno.test("respects content_type from media_files row", async () => {
  resetMocks();
  setupMockFetch();
  try {
    mockMediaRow = { google_drive_file_id: "drive-id-456", content_type: "image/jpeg", status: "exported" };
    mockTokenOwner = { google_drive_refresh_token: "good-token" };
    const result = await simulateHandler({ mediaId: "abc", exp: FUTURE, sig: await validSig("abc"), nowSeconds: NOW });
    assertEquals(result.status, 200);
    assertEquals(result.contentType, "image/jpeg");
  } finally {
    restoreFetch();
  }
});
