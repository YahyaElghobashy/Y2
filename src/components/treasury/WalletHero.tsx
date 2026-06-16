"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none"
}

/**
 * WalletHero — the CoYYns wallet centerpiece (docs/DESIGN_BLUEPRINT.md §5.0).
 * Big coin + count-up balance over a sunburst, with both partners' pots.
 * Presentational; the page feeds real balances from useCoyyns.
 */
function useCountUp(target: number, ms = 850) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export type WalletHeroProps = {
  userName: string
  partnerName: string
  balance: number
  partnerBalance: number
}

export function WalletHero({ userName, partnerName, balance, partnerBalance }: WalletHeroProps) {
  const count = useCountUp(balance)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative overflow-hidden rounded-[28px] px-5 pb-5 pt-7 text-center"
      style={{ background: "linear-gradient(165deg, #2A2018 0%, #3A2B1A 60%, #5A3B1E 100%)", boxShadow: "var(--shadow-warm-xl)" }}
    >
      {/* sunburst backdrop */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/backdrops/backdrop-sunburst.webp"
        alt=""
        aria-hidden
        onError={hideOnError}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.16] mix-blend-screen"
      />
      <div className="relative">
        <motion.div
          initial={{ scale: 0.8, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 180 }}
          className="mx-auto"
          style={{ width: 72, height: 72 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/coins/coin-yy.webp" alt="" aria-hidden onError={hideOnError} width={72} height={72} className="h-full w-full object-contain" />
        </motion.div>

        <div className="mt-3 flex items-end justify-center gap-1.5">
          <span className="text-[52px] font-extrabold leading-none tabular-nums" style={{ fontFamily: "var(--font-display)", color: "#FFF7EF" }}>
            {count.toLocaleString()}
          </span>
          <span className="pb-2 text-[18px] font-bold" style={{ fontFamily: "var(--font-body)", color: "var(--color-amber)" }}>¢y</span>
        </div>

        <p className="mt-1 text-[16px]" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#F2C99B" }}>
          our shared joy pot
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {[
            { who: userName, bal: balance, dot: "var(--color-preference-me)" },
            { who: partnerName, bal: partnerBalance, dot: "var(--color-preference-partner)" },
          ].map((p) => (
            <div key={p.who} className="rounded-2xl px-3 py-2.5 text-left" style={{ background: "rgba(255,247,239,0.08)" }}>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: p.dot }} />
                <span className="truncate text-[12px] font-semibold" style={{ fontFamily: "var(--font-body)", color: "#F4E3C8" }}>{p.who}</span>
              </span>
              <span className="mt-0.5 block text-[18px] font-bold tabular-nums" style={{ fontFamily: "var(--font-display)", color: "#FFF7EF" }}>
                {p.bal.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
