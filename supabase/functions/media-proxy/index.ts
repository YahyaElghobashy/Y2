// ============================================================
// TF07: Media Proxy Edge Function
// Serves exported images from Google Drive via proxy.
// Called with ?id={media_file_id}&key={MEDIA_PROXY_KEY}
// Returns the image with long-lived Cache-Control headers.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS Headers ────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Cache: 30 days (images are immutable after export)
const CACHE_MAX_AGE = 86400 * 30;
const STALE_WHILE_REVALIDATE = 86400 * 7;

// ── Helpers ─────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
    const proxyKey = url.searchParams.get("key");

    // Validate required params
    if (!mediaId) {
      return jsonResponse({ error: "id parameter required" }, 400);
    }

    // Auth: verify proxy key (simple shared secret for private 2-user app)
    const expectedKey = Deno.env.get("MEDIA_PROXY_KEY");
    if (!expectedKey || proxyKey !== expectedKey) {
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

    // Stream the response with cache headers
    return new Response(driveResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": media.content_type || "image/webp",
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
        "X-Media-Id": mediaId,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return jsonResponse({ error: msg }, 500);
  }
});
