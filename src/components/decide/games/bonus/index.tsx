"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Coins, Hand, Sparkles, Swords, Timer, type LucideIcon } from "lucide-react"
import type { SelectorGame, SelectorGameProps } from "../../contract"
import CoinFlip from "./CoinFlip"
import MagicEightBall from "./MagicEightBall"
import Bracket from "./Bracket"
import DrawStraws from "./DrawStraws"
import CountdownPicker from "./CountdownPicker"

/**
 * "ASK FATE" — a small pack of five playful quick deciders. The Component is a
 * menu that hands off to one sub-tool at a time; each sub-tool is a pure picker
 * that animates its reveal and then calls `onResult` once (see ./shared).
 *
 * Lives entirely under games/bonus/ — the suite contract and registry are
 * untouched. `label` stays "Ask Fate" because TheDecider surfaces it by that
 * exact name.
 */

type Mode = "coin" | "eightball" | "bracket" | "straws" | "countdown"

type ToolDef = {
  mode: Mode
  label: string
  tagline: string
  Icon: LucideIcon
  accent: string
  testid: string
}

const TOOLS: ToolDef[] = [
  { mode: "coin", label: "Coin Flip", tagline: "Heads or tails — two options, one toss.", Icon: Coins, accent: "var(--color-amber)", testid: "bonus-menu-coin" },
  { mode: "eightball", label: "Magic 8-Ball", tagline: "Shake it and let fate answer.", Icon: Sparkles, accent: "var(--color-indigo)", testid: "bonus-menu-eightball" },
  { mode: "bracket", label: "Knockout", tagline: "Head-to-head rounds until one wins.", Icon: Swords, accent: "var(--color-terracotta)", testid: "bonus-menu-bracket" },
  { mode: "straws", label: "Draw Straws", tagline: "Pull the short straw to decide.", Icon: Hand, accent: "var(--color-teal)", testid: "bonus-menu-straws" },
  { mode: "countdown", label: "Countdown", tagline: "Ten seconds of pressure, then a pick.", Icon: Timer, accent: "var(--color-coral)", testid: "bonus-menu-countdown" },
]

function BonusGame({ options, onResult }: SelectorGameProps) {
  const [mode, setMode] = useState<Mode | null>(null)
  const back = () => setMode(null)

  if (mode === "coin") return <CoinFlip options={options} onResult={onResult} onBack={back} />
  if (mode === "eightball") return <MagicEightBall options={options} onResult={onResult} onBack={back} />
  if (mode === "bracket") return <Bracket options={options} onResult={onResult} onBack={back} />
  if (mode === "straws") return <DrawStraws options={options} onResult={onResult} onBack={back} />
  if (mode === "countdown") return <CountdownPicker options={options} onResult={onResult} onBack={back} />

  return (
    <div className="flex flex-col gap-3 py-1">
      <p
        className="text-center text-[13px]"
        style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}
      >
        Pick a quick decider.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {TOOLS.map((tool, i) => (
          <motion.button
            key={tool.mode}
            type="button"
            onClick={() => setMode(tool.mode)}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.22 }}
            className={`flex flex-col gap-1.5 rounded-2xl border p-3 text-left ${i === TOOLS.length - 1 ? "col-span-2" : ""}`}
            style={{ borderColor: "var(--border)", background: "var(--color-paper)", boxShadow: "var(--shadow-warm-sm)" }}
            data-testid={tool.testid}
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{ background: tool.accent, color: "var(--primary-foreground)" }}
            >
              <tool.Icon size={18} strokeWidth={2.2} />
            </span>
            <span
              className="text-[15px] font-extrabold leading-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              {tool.label}
            </span>
            <span
              className="text-[12px] leading-snug"
              style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-soft)" }}
            >
              {tool.tagline}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

const bonus: SelectorGame = {
  id: "bonus",
  label: "Ask Fate",
  arabicLabel: "اسأل القدر",
  whenToUse: "Can't choose? Five quick deciders — coin flip, magic 8-ball, knockout, straws, or a countdown.",
  kind: "playful",
  asset: "/assets/objects/object-05.png",
  Component: BonusGame,
}

export default bonus
