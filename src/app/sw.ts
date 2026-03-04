/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope & WorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document"
        },
      },
    ],
  },
})

// Handle push notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const data = event.notification.data as { type?: string; payload?: Record<string, string> } | undefined
  const route = getRouteForNotification(data?.type, data?.payload)

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if one exists
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus()
          if ("navigate" in client) {
            ;(client as WindowClient).navigate(route)
          }
          return
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(route)
    })
  )
})

function getRouteForNotification(type?: string, payload?: Record<string, string>): string {
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

serwist.addEventListeners()
