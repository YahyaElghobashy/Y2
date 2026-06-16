"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { MarketplaceView, type MarketItem } from "@/components/marketplace/MarketplaceView"
import { PurchaseConfirmModal } from "@/components/relationship/PurchaseConfirmModal"
import { ActivePurchaseCard } from "@/components/marketplace/ActivePurchaseCard"
import { PurchaseHistoryItem } from "@/components/marketplace/PurchaseHistoryItem"
import { useMarketplace } from "@/lib/hooks/use-marketplace"
import { useActivePurchases } from "@/lib/hooks/use-active-purchases"
import { usePurchaseHistory } from "@/lib/hooks/use-purchase-history"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { MarketplaceItem, Purchase } from "@/lib/types/marketplace.types"

const ACCENTS: MarketItem["accent"][] = ["teal", "indigo", "amber", "coral", "terracotta", "rose"]

export default function MarketplacePage() {
  const { partner } = useAuth()
  const { wallet } = useCoyyns()
  const balance = wallet?.balance ?? 0
  const { items, isLoading } = useMarketplace()
  const { activePurchases, completePurchase, declinePurchase } = useActivePurchases()
  const { history } = usePurchaseHistory()

  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const viewItems: MarketItem[] = useMemo(
    () =>
      items.map((item, i) => ({
        id: item.id,
        title: item.name,
        price: item.price,
        emoji: item.icon ?? "✦",
        accent: ACCENTS[i % ACCENTS.length],
      })),
    [items],
  )

  const handleBuy = (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (item) {
      setSelectedItem(item)
      setShowModal(true)
    }
  }

  const handleConfirmed = (_purchase: Purchase) => {
    setShowModal(false)
    setSelectedItem(null)
  }

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Marketplace" backHref="/treasury" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={4} />
        </div>
      </PageTransition>
    )
  }

  // Active purchases — incoming + outgoing, resolves live (love-economy loop).
  // onAcknowledge + onComplete both resolve to completePurchase: every positive
  // target action (veto "Got it", wildcard "Accept", task_order "Mark Complete",
  // dnd/extra_ping dismiss) is terminal → 'completed'. Only wildcard "Decline"
  // diverges → declinePurchase ('declined').
  const topSlot =
    activePurchases.length > 0 ? (
      <section className="mb-5" data-testid="active-purchases-section">
        <h2 className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
          Active
        </h2>
        <div className="flex flex-col gap-3">
          {activePurchases.map((purchase) => (
            <ActivePurchaseCard
              key={purchase.id}
              purchase={purchase}
              onAcknowledge={completePurchase}
              onComplete={completePurchase}
              onDecline={declinePurchase}
            />
          ))}
        </div>
      </section>
    ) : null

  const bottomSlot =
    history.length > 0 ? (
      <section className="mt-7" data-testid="purchase-history-section">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="flex w-full items-center justify-between"
          data-testid="purchase-history-toggle"
        >
          <h2 className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
            Purchase History
          </h2>
          <motion.div animate={{ rotate: showHistory ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} style={{ color: "var(--color-ink-soft)" }} />
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 pt-3" data-testid="purchase-history-list">
                {history.map((purchase) => (
                  <PurchaseHistoryItem key={purchase.id} purchase={purchase} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    ) : null

  return (
    <PageTransition>
      <MarketplaceView
        items={viewItems}
        initialBalance={balance}
        partnerName={partner?.display_name ?? "your love"}
        onBuy={handleBuy}
        topSlot={topSlot}
        bottomSlot={bottomSlot}
      />

      <PurchaseConfirmModal
        item={selectedItem}
        balance={balance}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedItem(null)
        }}
        onConfirmed={handleConfirmed}
      />
    </PageTransition>
  )
}
