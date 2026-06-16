"use client"

import { useEffect, useMemo } from "react"
import { PageTransition } from "@/components/animations"
import { PlayView, type PlayData } from "@/components/game/PlayView"
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import { GAME_MODE_LABELS } from "@/lib/types/game.types"

export default function GameHomePage() {
  const { activeSession, loadActiveSession } = useGameEngine()

  useEffect(() => {
    loadActiveSession()
  }, [loadActiveSession])

  const data: PlayData = useMemo(() => {
    if (!activeSession) return { active: null }
    return {
      active: {
        mode: GAME_MODE_LABELS[activeSession.mode].en,
        round: (activeSession.completed_rounds ?? 0) + 1,
        // TODO(wire): no per-turn field on the session row yet — defaults to your turn.
        yourTurn: true,
        href: `/game/${activeSession.mode.replace("_", "-")}/play?session=${activeSession.id}`,
      },
    }
  }, [activeSession])

  return (
    <PageTransition>
      <PlayView data={data} />
    </PageTransition>
  )
}
