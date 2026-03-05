// ============================================================
// TF07: Media Proxy Edge Function Tests
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

    // Token refresh
    if (url.includes("oauth2.googleapis.com/token")) {
      if (!mockTokenRefreshOk) {
        return new Response("error", { status: 400 });
      }
      return new Response(
        JSON.stringify({ access_token: "mock-access-token" }),
        { status: 200 }
      );
    }

    // Drive file download
    if (url.includes("googleapis.com/drive/v3/files/") && url.includes("alt=media")) {
      if (!mockDriveFetchOk) {
        return new Response("not found", { status: 404 });
      }
      return new Response(new Blob(["image-data"], { type: "image/webp" }), {
        status: 200,
      });
    }

    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

function restoreFetch() {
  globalThis.fetch = _originalFetch;
}

// ── Simulate Handler ────────────────────────────────────────

async function simulateHandler(params: {
  mediaId?: string | null;
  proxyKey?: string | null;
  expectedKey?: string;
}): Promise<{ status: number; data?: Record<string, unknown>; contentType?: string; cacheControl?: string }> {
  const { mediaId, proxyKey, expectedKey = "test-proxy-key" } = params;

  // Validate params
  if (!mediaId) {
    return { status: 400, data: { error: "id parameter required" } };
  }

  // Auth check
  if (!expectedKey || proxyKey !== expectedKey) {
    return { status: 401, data: { error: "Unauthorized" } };
  }

  const supabase = createMockSupabase();

  // Look up media
  const { data: media, error: dbErr } = await supabase
    .from("media_files")
    .select("google_drive_file_id, content_type, status")
    .eq("id", mediaId)
    .single();

  if (dbErr || !media) {
    return { status: 404, data: { error: "Media not found" } };
  }

  if (media.status !== "exported" || !media.google_drive_file_id) {
    return { status: 404, data: { error: "Media not available for proxy" } };
  }

  // Get token
  const { data: tokenOwnerData } = await supabase
    .from("profiles")
    .select("google_drive_refresh_token")
    .not("google_drive_refresh_token", "is", null)
    .limit(1)
    .single();

  if (!tokenOwnerData?.google_drive_refresh_token) {
    return { status: 503, data: { error: "No Drive connection" } };
  }

  // Refresh token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ refresh_token: tokenOwnerData.google_drive_refresh_token as string, grant_type: "refresh_token" }),
  });

  if (!tokenRes.ok) {
    return { status: 503, data: { error: "Token refresh failed" } };
  }

  const tokenData = await tokenRes.json();

  // Fetch from Drive
  const driveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${media.google_drive_file_id}?alt=media`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );

  if (!driveRes.ok) {
    return { status: 502, data: { error: "Drive fetch failed" } };
  }

  return {
    status: 200,
    contentType: (media.content_type as string) || "image/webp",
    cacheControl: "public, max-age=2592000, stale-while-revalidate=604800",
  };
}

// ── Tests ───────────────────────────────────────────────────

function resetMocks() {
  mockMediaRow = null;
  mockMediaError = null;
  mockTokenOwner = null;
  mockTokenRefreshOk = true;
  mockDriveFetchOk = true;
}

Deno.test("returns 400 when id parameter is missing", async () => {
  resetMocks();
  const result = await simulateHandler({ mediaId: null, proxyKey: "key" });
  assertEquals(result.status, 400);
  assertEquals(result.data?.error, "id parameter required");
});

Deno.test("returns 401 when proxy key is missing", async () => {
  resetMocks();
  const result = await simulateHandler({ mediaId: "abc", proxyKey: null });
  assertEquals(result.status, 401);
  assertEquals(result.data?.error, "Unauthorized");
});

Deno.test("returns 401 when proxy key is wrong", async () => {
  resetMocks();
  const result = await simulateHandler({
    mediaId: "abc",
    proxyKey: "wrong-key",
    expectedKey: "correct-key",
  });
  assertEquals(result.status, 401);
});

Deno.test("returns 404 when media_files row not found", async () => {
  resetMocks();
  mockMediaRow = null;
  mockMediaError = { message: "not found" };

  const result = await simulateHandler({
    mediaId: "abc",
    proxyKey: "test-proxy-key",
  });
  assertEquals(result.status, 404);
  assertEquals(result.data?.error, "Media not found");
});

Deno.test("returns 404 when status is not exported", async () => {
  resetMocks();
  mockMediaRow = {
    google_drive_file_id: null,
    content_type: "image/webp",
    status: "active",
  };

  const result = await simulateHandler({
    mediaId: "abc",
    proxyKey: "test-proxy-key",
  });
  assertEquals(result.status, 404);
  assertEquals(result.data?.error, "Media not available for proxy");
});

Deno.test("returns 503 when no Drive token is available", async () => {
  resetMocks();
  setupMockFetch();
  try {
    mockMediaRow = {
      google_drive_file_id: "drive-id",
      content_type: "image/webp",
      status: "exported",
    };
    mockTokenOwner = null;

    const result = await simulateHandler({
      mediaId: "abc",
      proxyKey: "test-proxy-key",
    });
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
    mockMediaRow = {
      google_drive_file_id: "drive-id",
      content_type: "image/webp",
      status: "exported",
    };
    mockTokenOwner = { google_drive_refresh_token: "bad-token" };
    mockTokenRefreshOk = false;

    const result = await simulateHandler({
      mediaId: "abc",
      proxyKey: "test-proxy-key",
    });
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
    mockMediaRow = {
      google_drive_file_id: "drive-id",
      content_type: "image/webp",
      status: "exported",
    };
    mockTokenOwner = { google_drive_refresh_token: "good-token" };
    mockDriveFetchOk = false;

    const result = await simulateHandler({
      mediaId: "abc",
      proxyKey: "test-proxy-key",
    });
    assertEquals(result.status, 502);
    assertEquals(result.data?.error, "Drive fetch failed");
  } finally {
    restoreFetch();
  }
});

Deno.test("successful proxy returns correct content type and cache headers", async () => {
  resetMocks();
  setupMockFetch();
  try {
    mockMediaRow = {
      google_drive_file_id: "drive-id-123",
      content_type: "image/webp",
      status: "exported",
    };
    mockTokenOwner = { google_drive_refresh_token: "good-token" };

    const result = await simulateHandler({
      mediaId: "abc",
      proxyKey: "test-proxy-key",
    });
    assertEquals(result.status, 200);
    assertEquals(result.contentType, "image/webp");
    assertExists(result.cacheControl);
    assertEquals(result.cacheControl!.includes("max-age=2592000"), true);
  } finally {
    restoreFetch();
  }
});

Deno.test("respects content_type from media_files row", async () => {
  resetMocks();
  setupMockFetch();
  try {
    mockMediaRow = {
      google_drive_file_id: "drive-id-456",
      content_type: "image/jpeg",
      status: "exported",
    };
    mockTokenOwner = { google_drive_refresh_token: "good-token" };

    const result = await simulateHandler({
      mediaId: "abc",
      proxyKey: "test-proxy-key",
    });
    assertEquals(result.status, 200);
    assertEquals(result.contentType, "image/jpeg");
  } finally {
    restoreFetch();
  }
});
