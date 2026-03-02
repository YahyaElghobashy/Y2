"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Gift, Trophy, Plus } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { StaggerList } from "@/components/animations"
import { cn } from "@/lib/utils"

type MarketplaceTab = "shop" | "challenges"

type ShopItem = {
  id: string
  icon: "Bell" | "Gift"
  name: string
  description: string
  price: number | null
  available: boolean
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "extra-notifications",
    icon: "Bell",
    name: "Extra Notifications",
    description: "Send more messages today",
    price: 25,
    available: true,
  },
  {
    id: "coming-soon-1",
    icon: "Gift",
    name: "Coming Soon",
    description: "More items on the way",
    price: null,
    available: false,
  },
]

const ICON_MAP = {
  Bell,
  Gift,
} as const

const TABS: { key: MarketplaceTab; label: string }[] = [
  { key: "shop", label: "Shop" },
  { key: "challenges", label: "Challenges" },
]

// Hardcoded balance for V1 — will be replaced by useCoyyns (T302) when available
const MOCK_BALANCE = 1250

function CoyynsBadge({ balance }: { balance: number }) {
  return (
    <span
      className="flex items-center gap-1 font-mono text-[14px] font-medium text-accent-primary"
      data-testid="coyyns-badge"
    >
      <span aria-hidden="true">&#x1FA99;</span>
      {balance.toLocaleString()}
    </span>
  )
}

function ItemCardStub({
  item,
  disabled,
}: {
  item: ShopItem
  disabled: boolean
}) {
  const Icon = ICON_MAP[item.icon]
  const isComingSoon = !item.available

  return (
    <motion.div
      className={cn(
        "rounded-2xl bg-bg-elevated p-5 border border-border-subtle shadow-[0_2px_12px_rgba(44,40,37,0.06)]",
        isComingSoon && "opacity-60",
        disabled && item.available && "opacity-50 pointer-events-none"
      )}
      whileHover={!isComingSoon && !disabled ? { scale: 1.02, boxShadow: "0 4px 24px rgba(44,40,37,0.10)" } : undefined}
      whileTap={!isComingSoon && !disabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      data-testid="item-card"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft">
            <Icon
              className="h-[18px] w-[18px] text-accent-primary"
              strokeWidth={1.75}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-body text-[15px] font-semibold text-text-primary line-clamp-2">
              {item.name}
            </h3>
            <p className="font-body text-[13px] text-text-secondary line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>
        <span className="shrink-0 font-mono text-[14px] font-medium text-accent-primary">
          {item.price !== null ? (
            <>
              {item.price} <span aria-hidden="true">&#x1FA99;</span>
            </>
          ) : (
            "???"
          )}
        </span>
      </div>
    </motion.div>
  )
}

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>("shop")

  // V1: hardcoded balance — replace with useCoyyns() from T302
  const balance: number = MOCK_BALANCE
  const isBalanceZero = balance <= 0

  return (
    <main className="min-h-screen bg-bg-primary px-5 pt-4 pb-24">
      <PageTransition>
        <PageHeader
          title="Marketplace"
          backHref="/us"
          rightAction={<CoyynsBadge balance={balance} />}
        />

        {/* Tab bar */}
        <div className="flex h-11 items-end gap-6 mt-2" role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key

            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className="relative pb-2"
              >
                <span
                  className={cn(
                    "font-body text-[15px] font-medium transition-colors duration-200",
                    isActive
                      ? "text-text-primary font-bold"
                      : "text-text-secondary"
                  )}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="marketplace-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent-primary"
                    transition={{ duration: 0.25, ease: EASE_OUT }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "shop" ? (
            <motion.div
              key="shop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="mt-4"
            >
              <StaggerList className="flex flex-col gap-3">
                {SHOP_ITEMS.map((item) => (
                  <ItemCardStub
                    key={item.id}
                    item={item}
                    disabled={isBalanceZero}
                  />
                ))}
              </StaggerList>
            </motion.div>
          ) : (
            <motion.div
              key="challenges"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="mt-4"
            >
              {/* V1: No challenges — show EmptyState */}
              <EmptyState
                icon={<Trophy size={24} strokeWidth={1.75} />}
                title="No challenges yet"
                subtitle="Create one to get started"
              />
              <div className="mt-4 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="flex items-center gap-2 font-body text-[14px] font-medium text-accent-primary"
                  data-testid="create-challenge-btn"
                >
                  <Plus size={18} strokeWidth={1.75} />
                  Create Challenge
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageTransition>
    </main>
  )
}
