"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Wand2 } from "lucide-react"
import type { DecideOption, SelectorGame } from "./contract"
import { recommendTool } from "./decider"
import { GAMES } from "./registry"
import { OptionInput } from "./OptionInput"
import { makeOption } from "./shared/random"

type TheDeciderProps = {
  games?: SelectorGame[]
  /** Launch a tool with the current options. `autoRun` asks the hub to skip setup. */
  onLaunch: (game: SelectorGame, options: DecideOption[], opts?: { autoRun?: boolean }) => void
  className?: string
}

/**
 * THE DECIDER — the meta-picker. Describe the decision (and/or add the options),
 * and it recommends the best tool, then optionally auto-runs it.
 */
export function TheDecider({ games = GAMES, onLaunch, className }: TheDeciderProps) {
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<DecideOption[]>(() => [makeOption(""), makeOption("")])
  const [autoRun, setAutoRun] = useState(true)

  const filled = options.filter((o) => o.label.trim().length > 0)

  const rec = useMemo(
    () => recommendTool({ description, optionCount: filled.length }, games),
    [description, filled.length, games],
  )

  function use(game: SelectorGame) {
    const opts = filled.length >= 2 ? filled : options
    onLaunch(game, opts, { autoRun })
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-full"
          style={{ background: "var(--color-indigo)", color: "#FFF7EF" }}
          aria-hidden
        >
          <Wand2 size={17} strokeWidth={2} />
        </span>
        <div>
          <h3
            className="text-[17px] font-extrabold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            The Decider
          </h3>
          <p className="text-[12px]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
            Not sure which tool? Describe it.
          </p>
        </div>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What are you deciding? e.g. 'Where should we eat?' or 'Should I text first or wait?'"
        rows={2}
        aria-label="Describe your decision"
        className="w-full resize-none rounded-[10px] border px-3 py-2 text-[14px] outline-none"
        style={{
          borderColor: "var(--border)",
          background: "var(--background)",
          color: "var(--foreground)",
          fontFamily: "var(--font-body)",
        }}
        data-testid="decider-description"
      />

      <div className="mt-3">
        <p
          className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider"
          style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
        >
          Options
        </p>
        <OptionInput options={options} onChange={setOptions} showWeights={rec.kind === "weigh"} />
      </div>

      {/* Recommendation */}
      <motion.div
        key={rec.game.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-4 rounded-xl border p-3"
        style={{ borderColor: "var(--border)", background: "var(--color-sand)" }}
        data-testid="decider-recommendation"
      >
        <p className="text-[12px]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
          Recommended
        </p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span
            className="text-[19px] font-extrabold"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-indigo)" }}
            data-testid="decider-pick"
          >
            {rec.game.label}
          </span>
          <span
            className="text-[15px]"
            style={{ fontFamily: "var(--font-arabic)", color: "var(--color-ink-soft)" }}
            dir="rtl"
          >
            {rec.game.arabicLabel}
          </span>
        </div>
        <p
          className="mt-1 text-[13px]"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-ink-soft)" }}
        >
          {rec.reason}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => use(rec.game)}
            className="rounded-xl px-4 py-2 text-[14px] font-bold"
            style={{ background: "var(--color-indigo)", color: "#FFF7EF", fontFamily: "var(--font-nav)" }}
            data-testid="decider-use"
          >
            Use {rec.game.label}
          </button>

          {rec.alternatives.map((alt) => (
            <button
              key={alt.id}
              type="button"
              onClick={() => use(alt)}
              className="rounded-full border px-3 py-1.5 text-[12px] font-semibold"
              style={{ borderColor: "var(--border)", color: "var(--foreground)", fontFamily: "var(--font-nav)" }}
              data-testid={`decider-alt-${alt.id}`}
            >
              {alt.label}
            </button>
          ))}
        </div>

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px]" style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-nav)" }}>
          <input
            type="checkbox"
            checked={autoRun}
            onChange={(e) => setAutoRun(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-indigo)]"
            data-testid="decider-autorun"
          />
          Auto-run when I pick (skip setup if options are ready)
        </label>
      </motion.div>
    </div>
  )
}
