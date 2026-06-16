// ============================================================
// Signed media-proxy URLs (server-only).
//
// The media-proxy edge function serves exported (Google-Drive-backed) media.
// Plain <img> requests can't carry a Supabase JWT, so the function runs with
// verify_jwt = false and instead trusts a short-lived HMAC signature minted
// here. The signing secret (MEDIA_PROXY_KEY) NEVER reaches the browser — only
// the per-image signature + expiry do — so a leaked URL grants access to ONE
// media id for at most `ttlSeconds`, and no one can forge a URL for another id.
//
// Signature: base64url( HMAC-SHA256( `${id}.${exp}`, MEDIA_PROXY_KEY ) )
//   exp = unix seconds at which the URL stops being valid.
// The media-proxy edge function re-derives the same value with Web Crypto.
// ============================================================

import { createHmac, timingSafeEqual } from "node:crypto"

export const DEFAULT_TTL_SECONDS = 60 * 60 // 1 hour

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** Raw HMAC of `${id}.${exp}` keyed by the secret, base64url-encoded. */
export function signMediaToken(id: string, exp: number, secret: string): string {
  const mac = createHmac("sha256", secret).update(`${id}.${exp}`).digest()
  return base64url(mac)
}

/** Resolve the signing secret from the server env (throws if unset). */
function requireSecret(): string {
  const secret = process.env.MEDIA_PROXY_KEY
  if (!secret) {
    throw new Error("MEDIA_PROXY_KEY is not configured")
  }
  return secret
}

/**
 * Build a fully-qualified, signed, short-lived media-proxy URL for `id`.
 * `nowSeconds` is injectable for deterministic tests.
 */
export function buildSignedProxyUrl(
  supabaseUrl: string,
  id: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): string {
  const exp = nowSeconds + ttlSeconds
  const sig = signMediaToken(id, exp, requireSecret())
  const base = supabaseUrl.replace(/\/$/, "")
  return `${base}/functions/v1/media-proxy?id=${encodeURIComponent(id)}&exp=${exp}&sig=${sig}`
}

/**
 * Verify a signature + expiry (mirror of the edge-function check, kept here so
 * the scheme is unit-testable end-to-end in Node). `nowSeconds` is injectable.
 */
export function verifyMediaToken(
  id: string,
  exp: number,
  sig: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!secret) return false
  if (!Number.isFinite(exp) || exp < nowSeconds) return false
  const expected = signMediaToken(id, exp, secret)
  const a = Buffer.from(expected)
  const b = Buffer.from(sig)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
