/**
 * Maps notification types to their target routes.
 * Used by the service worker click handler and can be used for in-app routing.
 */
export function getRouteForNotification(
  type?: string,
  payload?: Record<string, string>
): string {
  switch (type) {
    case "coupon_received":
    case "coupon_redeemed":
    case "coupon_approved":
      return payload?.coupon_id ? `/us/coupons/${payload.coupon_id}` : "/us/coupons"
    case "ping":
      return "/us/ping"
    case "challenge_created":
    case "challenge_claimed":
      return "/us/marketplace"
    case "purchase_received":
      return "/"
    case "daily_bonus":
      return "/us/coyyns"
    default:
      return "/"
  }
}
