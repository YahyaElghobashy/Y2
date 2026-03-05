const APP_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "https://hayah.app"

/**
 * Generate a pairing deep link from an invite code.
 */
export function generatePairingLink(inviteCode: string): string {
  return `${APP_BASE_URL}/pair/${inviteCode}`
}

/**
 * Parse a pairing code from a URL string.
 * Returns the 6-char code or null if invalid.
 */
export function parsePairingCode(url: string): string | null {
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/^\/pair\/([A-Z0-9]{6})$/i)
    return match?.[1]?.toUpperCase() ?? null
  } catch {
    return null
  }
}

/**
 * Store a pending pair code in sessionStorage for post-login flow.
 */
export function storePendingPairCode(code: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("pending_pair_code", code)
  }
}

/**
 * Retrieve and clear a pending pair code from sessionStorage.
 */
export function consumePendingPairCode(): string | null {
  if (typeof window === "undefined") return null
  const code = sessionStorage.getItem("pending_pair_code")
  if (code) sessionStorage.removeItem("pending_pair_code")
  return code
}
