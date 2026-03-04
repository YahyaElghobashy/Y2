"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Ticket, Coins, Bell, ShoppingBag } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { PingTabContent } from "@/components/ping/PingTabContent"

const TABS = [
  { id: "notes", label: "Notes", icon: MessageCircle },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "coyyns", label: "CoYYns", icon: Coins },
  { id: "ping", label: "Ping", icon: Bell },
] as const

type TabId = (typeof TABS)[number]["id"]

const PLACEHOLDER_CONTENT: Record<
  string,
  { icon: React.ReactNode; title: string; subtitle: string; actionLabel?: string }
> = {
  notes: {
    icon: <MessageCircle size={48} strokeWidth={1.25} />,
    title: "No notes yet",
    subtitle: "Write your first love note",
    actionLabel: "Write a note",
  },
  coupons: {
    icon: <Ticket size={48} strokeWidth={1.25} />,
    title: "No coupons yet",
    subtitle: "Create one for your partner",
    actionLabel: "Create coupon",
  },
  coyyns: {
    icon: <Coins size={48} strokeWidth={1.25} />,
    title: "CoYYns wallet empty",
    subtitle: "Start earning together",
  },
}

export function RelationshipTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("notes")
  const router = useRouter()

  const handleTabClick = (tabId: TabId) => {
    if (tabId === "coupons") {
      router.push("/us/coupons")
      return
    }
    setActiveTab(tabId)
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border-subtle)] px-6" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.id)}
              className="relative flex flex-1 items-center justify-center gap-1.5 py-3"
            >
              <Icon
                size={16}
                className={
                  isActive
                    ? "text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)]"
                }
              />
              <span
                className={`font-[family-name:var(--font-body)] text-[13px] font-medium ${
                  isActive
                    ? "text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="us-tab-indicator"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-[var(--accent-primary)]"
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "ping" ? (
              <PingTabContent />
            ) : activeTab === "coyyns" ? (
              <div className="flex flex-col gap-4">
                {(() => {
                  const content = PLACEHOLDER_CONTENT[activeTab]
                  return content ? (
                    <EmptyState
                      icon={content.icon}
                      title={content.title}
                      subtitle={content.subtitle}
                    />
                  ) : null
                })()}
                <Link
                  href="/us/marketplace"
                  className="flex items-center gap-2 py-3 px-1 font-[family-name:var(--font-body)] text-[14px] font-medium text-[var(--accent-primary)]"
                  data-testid="marketplace-link"
                >
                  <ShoppingBag size={16} />
                  <span>Marketplace &rarr;</span>
                </Link>
              </div>
            ) : (
              (() => {
                const content = PLACEHOLDER_CONTENT[activeTab]
                return content ? (
                  <EmptyState
                    icon={content.icon}
                    title={content.title}
                    subtitle={content.subtitle}
                    actionLabel={content.actionLabel}
                    onAction={content.actionLabel ? () => {} : undefined}
                  />
                ) : null
              })()
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
