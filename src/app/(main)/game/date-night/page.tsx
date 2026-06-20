"use client"

import { DateNightSetup } from "@/components/game/DateNightSetup"

// Segment root for the Date Night game. Without this page the hub's mode link
// (/game/date-night) 404'd. Landing here shows the setup screen, which starts a
// session and routes on into /game/date-night/play.
export default function DateNightPage() {
  return <DateNightSetup />
}
