"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PillTab {
  id: string
  label: string
}

interface PillTabBarProps {
  tabs: PillTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  layoutId?: string
  className?: string
}

export function PillTabBar({
  tabs,
  activeTab,
  onTabChange,
  layoutId = "pill-tab",
  className,
}: PillTabBarProps) {
  return (
    <div className={cn("pill-tab-group", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "pill-tab relative",
            activeTab === tab.id && "text-white"
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 rounded-full bg-[var(--accent-copper,#B87333)]"
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
