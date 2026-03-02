"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Ticket, Coins, Bell } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

const TABS = [
  { id: "notes", label: "Notes", icon: MessageCircle },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "coyyns", label: "CoYYns", icon: Coins },
  { id: "send", label: "Send", icon: Bell },
] as const

type TabId = (typeof TABS)[number]["id"]

const TAB_CONTENT: Record<
  TabId,
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
  send: {
    icon: <Bell size={48} strokeWidth={1.25} />,
    title: "Send a notification",
    subtitle: "Surprise your partner with a message",
  },
}

export function RelationshipTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("notes")

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border-subtle)] px-6">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"
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
            <EmptyState
              icon={TAB_CONTENT[activeTab].icon}
              title={TAB_CONTENT[activeTab].title}
              subtitle={TAB_CONTENT[activeTab].subtitle}
              actionLabel={TAB_CONTENT[activeTab].actionLabel}
              onAction={
                TAB_CONTENT[activeTab].actionLabel ? () => {} : undefined
              }
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
