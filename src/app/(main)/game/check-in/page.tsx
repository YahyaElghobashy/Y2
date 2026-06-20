"use client"

import { CheckInSetup } from "@/components/game/CheckInSetup"

// Segment root for the Check-In game. Without this page the hub's mode link
// (/game/check-in) 404'd. Landing here shows the setup screen, which starts a
// session and routes on into /game/check-in/play.
export default function CheckInPage() {
  return <CheckInSetup />
}
