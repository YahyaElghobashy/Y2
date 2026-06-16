"use client"

import { useMemo, useState } from "react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { MarketplaceView, type MarketItem } from "@/components/marketplace/MarketplaceView"
import { PurchaseConfirmModal } from "@/components/relationship/PurchaseConfirmModal"
import { useMarketplace } from "@/lib/hooks/use-marketplace"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { MarketplaceItem, Purchase } from "@/lib/types/marketplace.types"

const ACCENTS: MarketItem["accent"][] = ["teal", "indigo", "amber", "coral", "terracotta", "rose"]

export default function MarketplacePage() {
  const { partner } = useAuth()
  const { wallet } = useCoyyns()
  const balance = wallet?.balance ?? 0
  const { items, isLoading } = useMarketplace()

  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)
  const [showModal, setShowModal] = useState(false)

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

  return (
    <PageTransition>
      <MarketplaceView
        items={viewItems}
        initialBalance={balance}
        partnerName={partner?.display_name ?? "your love"}
        onBuy={handleBuy}
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
