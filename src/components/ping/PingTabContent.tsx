"use client"

import { useState } from "react"
import { useNotifications } from "@/lib/hooks/use-notifications"
import { PushPermissionPrompt } from "@/components/shared/PushPermissionPrompt"
import { SendLimitIndicator } from "@/components/relationship/SendLimitIndicator"
import { NotificationBuilder } from "@/components/relationship/NotificationBuilder"
import { CustomPingComposer } from "@/components/ping/CustomPingComposer"
import { PingHistory } from "@/components/ping/PingHistory"
import { BuyExtraPingModal } from "@/components/ping/BuyExtraPingModal"

export function PingTabContent() {
  const { remainingSends, dailyLimit, refreshLimits } = useNotifications()
  const [showBuyModal, setShowBuyModal] = useState(false)

  const bonusSends = dailyLimit?.bonus_sends_available ?? 0

  return (
    <div className="flex flex-col gap-5" data-testid="ping-tab-content">
      <PushPermissionPrompt />

      <SendLimitIndicator
        remainingSends={remainingSends}
        bonusSends={bonusSends}
        onBuyMore={() => setShowBuyModal(true)}
      />

      <NotificationBuilder onBuyMore={() => setShowBuyModal(true)} />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="text-[12px] font-[var(--font-body)] text-text-muted">
          or write your own
        </span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      <CustomPingComposer />

      <PingHistory />

      <BuyExtraPingModal
        open={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onPurchased={() => {
          refreshLimits()
        }}
      />
    </div>
  )
}
