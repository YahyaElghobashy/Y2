"use client"

import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { MarketplaceAdminView } from "@/components/marketplace/MarketplaceAdminView"
import { useMarketplaceAdmin } from "@/lib/hooks/use-marketplace-admin"

export default function MarketplaceAdminPage() {
  const { items, isLoading, createItem, updateItem, toggleActive, deleteItem } = useMarketplaceAdmin()

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Manage Items" backHref="/us/marketplace" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={4} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageHeader title="Manage Items" backHref="/us/marketplace" />
      <MarketplaceAdminView
        items={items}
        onCreate={createItem}
        onUpdate={updateItem}
        onToggleActive={toggleActive}
        onDelete={deleteItem}
      />
    </PageTransition>
  )
}
