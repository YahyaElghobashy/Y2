import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  signMediaToken,
  verifyMediaToken,
  buildSignedProxyUrl,
} from "@/lib/media/signed-url"

const SECRET = "test-secret-key-123"

describe("signMediaToken / verifyMediaToken", () => {
  it("round-trips a valid, unexpired signature", () => {
    const exp = 2_000_000_000
    const sig = signMediaToken("media-1", exp, SECRET)
    expect(verifyMediaToken("media-1", exp, sig, SECRET, 1000)).toBe(true)
  })

  it("rejects an expired token", () => {
    const exp = 100
    const sig = signMediaToken("media-1", exp, SECRET)
    expect(verifyMediaToken("media-1", exp, sig, SECRET, 200)).toBe(false)
  })

  it("rejects a tampered id", () => {
    const exp = 2_000_000_000
    const sig = signMediaToken("media-1", exp, SECRET)
    expect(verifyMediaToken("media-2", exp, sig, SECRET, 1000)).toBe(false)
  })

  it("rejects a tampered exp", () => {
    const exp = 2_000_000_000
    const sig = signMediaToken("media-1", exp, SECRET)
    expect(verifyMediaToken("media-1", exp + 1, sig, SECRET, 1000)).toBe(false)
  })

  it("rejects a signature made with a different secret", () => {
    const exp = 2_000_000_000
    const sig = signMediaToken("media-1", exp, SECRET)
    expect(verifyMediaToken("media-1", exp, sig, "other-secret", 1000)).toBe(false)
  })

  it("rejects when the verifying secret is empty", () => {
    expect(verifyMediaToken("m", 2_000_000_000, "x", "", 1000)).toBe(false)
  })

  it("rejects a non-finite exp", () => {
    expect(verifyMediaToken("m", Number.NaN, "x", SECRET, 1000)).toBe(false)
  })

  it("emits base64url output (no +, /, or = padding)", () => {
    const sig = signMediaToken("m", 123, SECRET)
    expect(sig).not.toMatch(/[+/=]/)
  })
})

describe("buildSignedProxyUrl", () => {
  beforeEach(() => {
    process.env.MEDIA_PROXY_KEY = SECRET
  })
  afterEach(() => {
    delete process.env.MEDIA_PROXY_KEY
  })

  it("builds a fully-qualified url with id, exp and sig and strips a trailing slash", () => {
    const url = buildSignedProxyUrl("https://x.supabase.co/", "media-1", 3600, 1000)
    const expectedSig = signMediaToken("media-1", 4600, SECRET)
    expect(url).toBe(
      `https://x.supabase.co/functions/v1/media-proxy?id=media-1&exp=4600&sig=${expectedSig}`,
    )
  })

  it("never embeds the raw secret in the url", () => {
    const url = buildSignedProxyUrl("https://x.supabase.co", "media-1", 3600, 1000)
    expect(url).not.toContain(SECRET)
  })

  it("throws (rather than minting an open url) when the secret is unset", () => {
    delete process.env.MEDIA_PROXY_KEY
    expect(() => buildSignedProxyUrl("https://x.supabase.co", "m")).toThrow(
      "MEDIA_PROXY_KEY is not configured",
    )
  })
})

describe("cross-implementation parity (Node crypto vs Web Crypto / Deno edge fn)", () => {
  it("the Node signer matches a Web-Crypto HMAC, exactly as the media-proxy edge function computes it", async () => {
    const id = "media-xyz"
    const exp = 1_781_600_000
    const nodeSig = signMediaToken(id, exp, SECRET)

    // Recompute with the SAME algorithm the Deno edge function uses
    // (crypto.subtle HMAC-SHA256 → base64url). If these diverge, a signed
    // URL minted in Next.js would be rejected by the deployed function.
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    )
    const mac = await globalThis.crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${id}.${exp}`),
    )
    const bytes = new Uint8Array(mac)
    let bin = ""
    for (const b of bytes) bin += String.fromCharCode(b)
    const webSig = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

    expect(webSig).toBe(nodeSig)
  })
})
