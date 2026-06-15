"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Plus, ChevronDown } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { CoyynsBadge } from "@/components/shared/CoyynsBadge"
import { StaggerList } from "@/components/animations"
import {
  MarketplaceItemCard,
  MarketplaceItemCardSkeleton,
} from "@/components/relationship/MarketplaceItemCard"
import { PurchaseConfirmModal } from "@/components/relationship/PurchaseConfirmModal"
import { CreateChallengeForm } from "@/components/relationship/CreateChallengeForm"
import { ActivePurchaseCard } from "@/components/marketplace/ActivePurchaseCard"
import { PurchaseHistoryItem } from "@/components/marketplace/PurchaseHistoryItem"
import { useMarketplace } from "@/lib/hooks/use-marketplace"
import { useActivePurchases } from "@/lib/hooks/use-active-purchases"
import { usePurchaseHistory } from "@/lib/hooks/use-purchase-history"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { cn } from "@/lib/utils"
import type { MarketplaceItem, Purchase } from "@/lib/types/marketplace.types"

type MarketplaceTab = "shop" | "challenges"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const TABS: { key: MarketplaceTab; label: string }[] = [
  { key: "shop", label: "Shop" },
  { key: "challenges", label: "Challenges" },
]

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>("shop")
  const { wallet } = useCoyyns()
  const balance = wallet?.balance ?? 0
  const { items, isLoading, error } = useMarketplace()
  const { activePurchases, completePurchase, declinePurchase } =
    useActivePurchases()
  const { history } = usePurchaseHistory()

  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateChallenge, setShowCreateChallenge] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

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

  return (
    <main className="min-h-screen bg-bg-primary px-5 pt-4 pb-24">
      <PageTransition>
        <PageHeader
          title="Marketplace"
          backHref="/us"
          rightAction={<CoyynsBadge />}
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
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
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
              {/* Active purchases — incoming + outgoing, resolves live */}
              {activePurchases.length > 0 && (
                <section className="mb-6" data-testid="active-purchases-section">
                  <h2 className="mb-3 font-body text-[15px] font-semibold text-text-primary">
                    Active
                  </h2>
                  <div className="flex flex-col gap-3">
                    {activePurchases.map((purchase) => (
                      // onAcknowledge and onComplete both resolve to completePurchase
                      // on purpose: every positive target action (veto "Got it",
                      // wildcard "Accept", task_order "Mark Complete", dnd/extra_ping
                      // dismiss) is terminal here → 'completed'. Only wildcard
                      // "Decline" diverges → declinePurchase ('declined').
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
              )}

              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <MarketplaceItemCardSkeleton key={i} variant="vertical" />
                  ))}
                </div>
              ) : error && items.length === 0 ? (
                <EmptyState
                  icon={<Trophy size={24} strokeWidth={1.75} />}
                  title="Marketplace unavailable"
                  subtitle="Please try again later"
                />
              ) : items.length === 0 ? (
                <EmptyState
                  icon={<Trophy size={24} strokeWidth={1.75} />}
                  title="No items yet"
                  subtitle="Check back soon for new items"
                />
              ) : (
                <StaggerList className="grid grid-cols-2 gap-3">
                  {items.map((item) => (
                    <MarketplaceItemCard
                      key={item.id}
                      item={item}
                      balance={balance}
                      onBuy={handleBuy}
                      variant="vertical"
                    />
                  ))}
                </StaggerList>
              )}

              {/* Purchase history — past purchases for both partners */}
              {history.length > 0 && (
                <section className="mt-8" data-testid="purchase-history-section">
                  <button
                    type="button"
                    onClick={() => setShowHistory((v) => !v)}
                    className="flex w-full items-center justify-between"
                    data-testid="purchase-history-toggle"
                  >
                    <h2 className="font-body text-[15px] font-semibold text-text-primary">
                      Purchase History
                    </h2>
                    <motion.div
                      animate={{ rotate: showHistory ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} className="text-text-secondary" />
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
                        <div
                          className="flex flex-col gap-2 pt-3"
                          data-testid="purchase-history-list"
                        >
                          {history.map((purchase) => (
                            <PurchaseHistoryItem
                              key={purchase.id}
                              purchase={purchase}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              )}
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
              {/* V1: No challenges -- show EmptyState */}
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
                  onClick={() => setShowCreateChallenge(true)}
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

      {/* Purchase modal */}
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

      <CreateChallengeForm
        open={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        onCreated={() => setShowCreateChallenge(false)}
      />
    </main>
  )
}
