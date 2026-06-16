"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CouponTicket, type CouponStatus } from "@/components/coupons/CouponTicket"
import { Celebration } from "@/components/shared/Celebration"
import { EmptyState } from "@/components/shared/EmptyState"

export type CouponItem = {
  id: string
  title: string
  from: string
  status: CouponStatus
  mine: boolean // I created it (for partner)
}

type Tab = "forme" | "imade" | "history"
const TABS: { id: Tab; label: string }[] = [
  { id: "forme", label: "For me" },
  { id: "imade", label: "I made" },
  { id: "history", label: "History" },
]

export function CouponsView({ initial }: { initial: CouponItem[] }) {
  const [coupons, setCoupons] = useState(initial)
  const [tab, setTab] = useState<Tab>("forme")
  const [celebrate, setCelebrate] = useState<{ open: boolean; title: string }>({ open: false, title: "" })

  const redeem = (id: string) => {
    const c = coupons.find((x) => x.id === id)
    setCoupons((cs) => cs.map((x) => (x.id === id ? { ...x, status: "redeemed" } : x)))
    setCelebrate({ open: true, title: c?.title ?? "" })
  }

  const list = coupons.filter((c) =>
    tab === "forme" ? !c.mine && c.status !== "redeemed" : tab === "imade" ? c.mine : c.status === "redeemed",
  )

  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-4">
        <h1 className="text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
          Coupons
        </h1>
        <p className="mt-0.5 text-[15px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>
          Promises you can redeem — little gifts, kept on paper.
        </p>
      </header>

      <div className="pill-tab-group mb-4">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`pill-tab ${tab === t.id ? "pill-tab-active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {list.length > 0 ? (
        <div className="grid gap-3">
          {list.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.05 }}>
              <CouponTicket
                title={c.title}
                from={c.from}
                status={c.status}
                onRedeem={tab === "forme" ? () => redeem(c.id) : undefined}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          scene="scene-keepsake-open"
          title={tab === "imade" ? "Make your first coupon" : tab === "history" ? "Nothing redeemed yet" : "No coupons waiting"}
          subtitle={tab === "imade" ? "A promise, written down, means more." : "When one is redeemed, it lands here."}
          actionLabel={tab === "imade" ? "Create a coupon" : undefined}
          actionHref={tab === "imade" ? "/create-coupon" : undefined}
        />
      )}

      <Celebration
        open={celebrate.open}
        tone="big"
        title="Redeemed ✦"
        subtitle={celebrate.title}
        onDone={() => setCelebrate((s) => ({ ...s, open: false }))}
      />
    </div>
  )
}

export const COUPONS_MOCK: CouponItem[] = [
  { id: "1", title: "One breakfast in bed, no questions asked", from: "Yara", status: "active", mine: false },
  { id: "2", title: "A 20-minute back rub", from: "Yara", status: "active", mine: false },
  { id: "3", title: "I pick the movie, you bring snacks", from: "You", status: "active", mine: true },
  { id: "4", title: "One forgiven chore", from: "Yara", status: "redeemed", mine: false },
]
