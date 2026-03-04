"use client"

import Link from "next/link"
import { HeartPulse, Sun, Repeat, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"

const SECTIONS = [
  {
    icon: HeartPulse,
    title: "Body",
    subtitle: "Cycle tracking & wellness",
    href: "/me/body",
  },
  {
    icon: Sun,
    title: "Soul",
    subtitle: "Prayer & spiritual practice",
    href: "/me/soul",
  },
  {
    icon: Repeat,
    title: "Rituals",
    subtitle: "Daily habits & practices",
    href: "/me/rituals",
  },
] as const

export default function MePage() {
  return (
    <PageTransition>
      <PageHeader title="Me" />
      <div className="flex flex-col gap-4 px-5 py-5">
        {SECTIONS.map((section, i) => {
          const Icon = section.icon
          return (
            <motion.div
              key={section.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <Link
                href={section.href}
                className="flex items-center gap-4 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] p-4 shadow-[var(--shadow-soft)] active:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)]">
                  <Icon size={24} strokeWidth={1.5} className="text-[var(--color-accent-primary)]" />
                </div>
                <div className="flex-1">
                  <p className="font-[family-name:var(--font-display)] text-[17px] font-semibold text-[var(--color-text-primary)]">
                    {section.title}
                  </p>
                  <p className="font-[family-name:var(--font-body)] text-[13px] text-[var(--color-text-secondary)]">
                    {section.subtitle}
                  </p>
                </div>
                <ChevronRight size={18} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </PageTransition>
  )
}
