"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"
import { WalletHero, type WalletHeroProps } from "@/components/treasury/WalletHero"
import type { HubRoom } from "@/components/shared/WorldHub"

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export type TreasuryViewData = {
  wallet: WalletHeroProps
  rooms: HubRoom[]
}

export function TreasuryView({ data }: { data: TreasuryViewData }) {
  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-4">
        <p className="text-[19px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-terracotta)" }}>
          الخزينة
        </p>
        <h1 className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
          The Treasury
        </h1>
      </header>

      <WalletHero {...data.wallet} />

      <div className="mt-4 grid gap-3">
        {data.rooms.map((r, i) => (
          <motion.div
            key={r.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.08 + i * 0.06 }}
          >
            <Link href={r.href}>
              <PosterCard accent={r.accent} interactive className="flex items-center gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: "var(--color-sand)" }}>
                  {r.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{r.label}</span>
                  <span className="block truncate text-[13px]" style={{ color: "var(--color-ink-soft)" }}>{r.line}</span>
                </span>
                <ChevronRight size={18} style={{ color: "var(--color-ink-soft)" }} />
              </PosterCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const ROOMS: HubRoom[] = [
  { label: "Coupons", line: "Promises you can redeem", href: "/us/coupons", emoji: "🎟", accent: "coral" },
  { label: "Marketplace", line: "Spend CoYYns on each other", href: "/us/marketplace", emoji: "🛍", accent: "terracotta" },
  { label: "Challenges", line: "Playful stakes & bounties", href: "/us/coyyns", emoji: "🏅", accent: "indigo" },
  { label: "Wishlist", line: "Things you're dreaming of", href: "/us/wishlist", emoji: "✨", accent: "rose" },
]

export const TREASURY_MOCK: TreasuryViewData = {
  wallet: { userName: "Yahya", partnerName: "Yara", balance: 248, partnerBalance: 312 },
  rooms: ROOMS,
}

export { ROOMS as TREASURY_ROOMS }
