"use client"

import { MarketplaceAdminView } from "@/components/marketplace/MarketplaceAdminView"
import { BottomNav } from "@/components/shared/BottomNav"
import type { MarketplaceItem } from "@/lib/types/marketplace.types"

const ADMIN_MOCK: MarketplaceItem[] = [
  { id: "1", name: "Extra Notification", description: "One guaranteed extra notification.", price: 10, icon: "🔔", effect_type: "extra_ping", effect_config: { extra_sends: 1 }, is_active: true, sort_order: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "2", name: "Movie Night Veto", description: "Override movie night, your pick.", price: 25, icon: "🎬", effect_type: "veto", effect_config: { requires_input: true, input_prompt: "What movie?" }, is_active: true, sort_order: 2, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "3", name: "Breakfast in Bed", description: "Claim breakfast in bed within 24h.", price: 40, icon: "🍳", effect_type: "task_order", effect_config: { deadline_hours: 24, task_description: "Make breakfast in bed" }, is_active: true, sort_order: 3, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "4", name: "1 Hour of Silence", description: "Sixty minutes do-not-disturb.", price: 15, icon: "🤫", effect_type: "dnd_timer", effect_config: { duration_minutes: 60 }, is_active: false, sort_order: 4, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "5", name: "Wildcard Favor", description: "Negotiate any wish.", price: 50, icon: "🃏", effect_type: "wildcard", effect_config: { negotiable: true, requires_input: true, input_prompt: "What's your wish?" }, is_active: true, sort_order: 5, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
]

export default function PreviewMarketplaceAdminPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <MarketplaceAdminView items={ADMIN_MOCK} />
      <BottomNav />
    </div>
  )
}
