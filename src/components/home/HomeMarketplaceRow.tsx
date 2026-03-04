"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useMarketplace } from "@/lib/hooks/use-marketplace"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import {
  MarketplaceItemCard,
  MarketplaceItemCardSkeleton,
} from "@/components/relationship/MarketplaceItemCard"
import { PurchaseConfirmModal } from "@/components/relationship/PurchaseConfirmModal"
import type { MarketplaceItem, Purchase } from "@/lib/types/marketplace.types"

type HomeMarketplaceRowProps = {
  className?: string
}

export function HomeMarketplaceRow({ className }: HomeMarketplaceRowProps) {
  const { items, isLoading, error } = useMarketplace()
  const { wallet } = useCoyyns()
  const balance = wallet?.balance ?? 0

  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null)
  const [showModal, setShowModal] = useState(false)

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

  // Error state
  if (error && !isLoading && items.length === 0) {
    return (
      <div className={cn("px-5", className)} data-testid="home-marketplace-row">
        <p className="font-body text-[13px] text-text-muted text-center py-4">
          Marketplace unavailable
        </p>
      </div>
    )
  }

  return (
    <div className={cn(className)} data-testid="home-marketplace-row">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <h2 className="font-body text-[15px] font-semibold text-text-primary">
          Quick Buys
        </h2>
        <Link
          href="/us/marketplace"
          className="font-body text-[13px] font-medium text-accent-primary"
          data-testid="see-all-link"
        >
          See All &rarr;
        </Link>
      </div>

      {/* Horizontal scroll container */}
      <div className="relative">
        {/* Left fade gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
        {/* Right fade gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

        <div
          className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          data-testid="scroll-container"
        >
          {isLoading
            ? Array.from({ length: 5 }, (_, i) => (
                <MarketplaceItemCardSkeleton key={i} variant="horizontal" />
              ))
            : items.slice(0, 5).map((item) => (
                <MarketplaceItemCard
                  key={item.id}
                  item={item}
                  balance={balance}
                  onBuy={handleBuy}
                  variant="horizontal"
                  className="snap-start"
                />
              ))}
        </div>
      </div>

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
    </div>
  )
}
