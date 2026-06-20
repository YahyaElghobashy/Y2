"use client"

import { DeepDiveSetup } from "@/components/game/DeepDiveSetup"

// Segment root for the Deep Dive game. Without this page the hub's mode link
// (/game/deep-dive) 404'd. Landing here shows the setup screen, which starts a
// session and routes on into /game/deep-dive/play.
export default function DeepDivePage() {
  return <DeepDiveSetup />
}
