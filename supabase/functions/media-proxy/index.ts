// ============================================================
// TF07 / W4: Media Proxy Edge Function
// Serves exported images from Google Drive via proxy.
// Called with ?id={media_file_id}&exp={unix_seconds}&sig={hmac}
//
// Deployed with verify_jwt = false so a plain <img> (which cannot send a
// Supabase JWT) can load. Access is instead gated by a SHORT-LIVED HMAC
// signature minted server-side by the Next.js /api/media/[id] route. The
// signing secret (MEDIA_PROXY_KEY) never leaves the server; a leaked URL is
// good for ONE media id for at most its TTL, and no id can be forged.
//
// Signature: base64url( HMAC-SHA256( `${id}.${exp}`, MEDIA_PROXY_KEY ) )
// Returns the image with a PRIVATE Cache-Control bounded to the signature's
// remaining lifetime, so a shared/CDN cache can never keep serving a media id
// past its signed expiry (which would defeat the short-lived guarantee).
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS Headers ────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Helpers ─────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// base64url-encode raw bytes (matches Node's Buffer.toString("base64url")).
function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// HMAC-SHA256(`${id}.${exp}`, secret) → base64url. Mirrors src/lib/media/signed-url.ts.
async function signMediaToken(
  id: string,
  exp: string,
  secret: string,
): Promise<string> {
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

// Constant-time string compare.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.access_token ?? null;
}

// ── Main Handler ────────────────────────────────────────────

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const mediaId = url.searchParams.get("id");
    const exp = url.searchParams.get("exp");
    const sig = url.searchParams.get("sig");

    // Validate required params
    if (!mediaId) {
      return jsonResponse({ error: "id parameter required" }, 400);
    }
    if (!exp || !sig) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Auth: short-lived HMAC signature (verify_jwt is off for this function).
    const secret = Deno.env.get("MEDIA_PROXY_KEY");
    if (!secret) {
      return jsonResponse({ error: "Proxy not configured" }, 500);
    }

    const expSeconds = Number(exp);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(expSeconds) || expSeconds < nowSeconds) {
      return jsonResponse({ error: "Link expired" }, 401);
    }

    const expectedSig = await signMediaToken(mediaId, exp, secret);
    if (!timingSafeEqual(expectedSig, sig)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Service role client for DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the media file
    const { data: media, error: dbErr } = await supabase
      .from("media_files")
      .select("google_drive_file_id, content_type, status")
      .eq("id", mediaId)
      .single();

    if (dbErr || !media) {
      return jsonResponse({ error: "Media not found" }, 404);
    }

    if (media.status !== "exported" || !media.google_drive_file_id) {
      return jsonResponse({ error: "Media not available for proxy" }, 404);
    }

    // Get Drive access token from any connected user
    const { data: tokenOwner } = await supabase
      .from("profiles")
      .select("google_drive_refresh_token")
      .not("google_drive_refresh_token", "is", null)
      .limit(1)
      .single();

    if (!tokenOwner?.google_drive_refresh_token) {
      return jsonResponse({ error: "No Drive connection" }, 503);
    }

    const accessToken = await getAccessToken(
      tokenOwner.google_drive_refresh_token
    );
    if (!accessToken) {
      return jsonResponse({ error: "Token refresh failed" }, 503);
    }

    // Fetch from Google Drive
    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${media.google_drive_file_id}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!driveResponse.ok) {
      return jsonResponse({ error: "Drive fetch failed" }, 502);
    }

    // Stream the response. Cache is PRIVATE and lives only as long as the
    // signature is still valid — never past `exp` — so a leaked/expired URL
    // can't be replayed out of a shared cache.
    const maxAge = Math.max(0, expSeconds - nowSeconds);
    return new Response(driveResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": media.content_type || "image/webp",
        "Cache-Control": `private, max-age=${maxAge}`,
        "X-Media-Id": mediaId,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return jsonResponse({ error: msg }, 500);
  }
});
