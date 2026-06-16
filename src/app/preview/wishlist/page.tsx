"use client"

import { WishlistView, WISHLIST_MINE, WISHLIST_PARTNER } from "@/components/wishlist/WishlistView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewWishlistPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <WishlistView mine={WISHLIST_MINE} partner={WISHLIST_PARTNER} />
      <BottomNav />
    </div>
  )
}
