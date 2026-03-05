// ============================================================
// T1402: TMDB Search Proxy Edge Function
// Proxies search requests to The Movie Database API.
// Requires TMDB_API_KEY env var set as Supabase secret.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS Headers ────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Helper: JSON response ───────────────────────────────────
function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  // ── CORS preflight ────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── Auth check ────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // ── Parse query ───────────────────────────────────────────
  const url = new URL(req.url);
  const query = url.searchParams.get("query");

  if (!query || query.trim().length === 0) {
    return jsonResponse({ error: "Missing query parameter" }, 400);
  }

  // ── TMDB API call ─────────────────────────────────────────
  const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
  if (!tmdbApiKey) {
    return jsonResponse({ error: "TMDB API key not configured" }, 500);
  }

  try {
    const tmdbUrl = new URL("https://api.themoviedb.org/3/search/multi");
    tmdbUrl.searchParams.set("api_key", tmdbApiKey);
    tmdbUrl.searchParams.set("query", query.trim());
    tmdbUrl.searchParams.set("include_adult", "false");
    tmdbUrl.searchParams.set("language", "en-US");
    tmdbUrl.searchParams.set("page", "1");

    const tmdbRes = await fetch(tmdbUrl.toString());

    if (!tmdbRes.ok) {
      return jsonResponse(
        { error: "TMDB API error", status: tmdbRes.status },
        502,
      );
    }

    const tmdbData = await tmdbRes.json();

    // Filter to only movie and tv results, map to our format
    const results = (tmdbData.results || [])
      .filter(
        (r: Record<string, unknown>) =>
          r.media_type === "movie" || r.media_type === "tv",
      )
      .slice(0, 20)
      .map((r: Record<string, unknown>) => ({
        id: r.id,
        title: r.media_type === "movie" ? r.title : r.name,
        media_type: r.media_type,
        poster_path: r.poster_path
          ? `https://image.tmdb.org/t/p/w342${r.poster_path}`
          : null,
        release_date:
          r.media_type === "movie" ? r.release_date : r.first_air_date,
        overview: r.overview || null,
        vote_average: r.vote_average || null,
      }));

    return jsonResponse({ results });
  } catch (err) {
    return jsonResponse(
      { error: "Failed to search TMDB", detail: String(err) },
      500,
    );
  }
});
