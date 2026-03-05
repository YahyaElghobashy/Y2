// ============================================================
// T1502: URL Metadata Extraction Edge Function
// Fetches a URL server-side and extracts OpenGraph metadata
// (og:title, og:image, og:description, og:price:amount).
// 5s timeout, null fallback on any failure.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function extractMeta(html: string, property: string): string | null {
  // Match <meta property="og:title" content="..." />
  // Also handles name= and single quotes
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
      "i"
    ),
  ];

  for (const regex of patterns) {
    const match = html.match(regex);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() ?? null;
}

// ── Main Handler ────────────────────────────────────────────

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth: verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Parse request body
    const body = await req.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return jsonResponse({ error: "url parameter required" }, 400);
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return jsonResponse({ error: "Invalid URL" }, 400);
    }

    // Fetch with 5s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let html: string;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        return jsonResponse({
          title: null,
          description: null,
          image: null,
          price: null,
          currency: null,
        });
      }

      html = await response.text();
    } catch {
      // Timeout or network error — return nulls
      return jsonResponse({
        title: null,
        description: null,
        image: null,
        price: null,
        currency: null,
      });
    } finally {
      clearTimeout(timeout);
    }

    // Extract OG metadata
    const ogTitle = extractMeta(html, "og:title");
    const ogDescription = extractMeta(html, "og:description");
    const ogImage = extractMeta(html, "og:image");
    const ogPrice = extractMeta(html, "og:price:amount") ??
      extractMeta(html, "product:price:amount");
    const ogCurrency = extractMeta(html, "og:price:currency") ??
      extractMeta(html, "product:price:currency");

    // Fallbacks
    const title = ogTitle ?? extractTitle(html);
    const description = ogDescription ??
      extractMeta(html, "description");

    // Parse price as number
    let price: number | null = null;
    if (ogPrice) {
      const parsed = parseFloat(ogPrice.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) price = parsed;
    }

    return jsonResponse({
      title: title ?? null,
      description: description ?? null,
      image: ogImage ?? null,
      price,
      currency: ogCurrency ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return jsonResponse({ error: msg }, 500);
  }
});
