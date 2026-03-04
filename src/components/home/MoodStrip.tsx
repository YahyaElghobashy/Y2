"use client"

import { useRouter } from "next/navigation"
import { Coins, Gift, CalendarDays, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { useCoupons } from "@/lib/hooks/use-coupons"
import { useNotifications } from "@/lib/hooks/use-notifications"

type ChipData = {
  icon: React.ReactNode
  label: string
  href: string
}

function SkeletonChip() {
  return (
    <div className="h-8 w-20 rounded-full bg-[var(--color-bg-secondary)] animate-pulse shrink-0" />
  )
}

type MoodChipProps = {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

function MoodChip({ icon, label, onClick }: MoodChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 shrink-0",
        "bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]",
        "font-[family-name:var(--font-body)] text-[12px] text-[var(--color-text-primary)]",
        "active:scale-[0.97] transition-transform duration-150"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

type MoodStripProps = {
  className?: string
}

export function MoodStrip({ className }: MoodStripProps) {
  const router = useRouter()
  const { wallet, isLoading: coyynsLoading } = useCoyyns()
  const { receivedCoupons, myCoupons, isLoading: couponsLoading } = useCoupons()
  const { remainingSends, isLoading: notificationsLoading } = useNotifications()

  const isLoading = coyynsLoading || couponsLoading || notificationsLoading

  // Compute chip data
  const balance = wallet?.balance ?? 0
  const activeCoupons = [...receivedCoupons, ...myCoupons].filter(
    (c) => c.status === "active"
  ).length

  const chips: ChipData[] = [
    {
      icon: <Coins size={16} strokeWidth={1.75} className="text-[var(--color-accent-primary)]" />,
      label: balance.toLocaleString(),
      href: "/us/coyyns",
    },
    {
      icon: <Gift size={16} strokeWidth={1.75} className="text-[var(--color-accent-primary)]" />,
      label: `${activeCoupons}`,
      href: "/us/coupons",
    },
    {
      icon: <CalendarDays size={16} strokeWidth={1.75} className="text-[var(--color-accent-primary)]" />,
      label: "\u2014",
      href: "/us/calendar",
    },
    {
      icon: <Bell size={16} strokeWidth={1.75} className="text-[var(--color-accent-primary)]" />,
      label: `${remainingSends}/2`,
      href: "/us/ping",
    },
  ]

  if (isLoading) {
    return (
      <div
        className={cn("flex gap-3 px-5 overflow-x-auto scrollbar-hide", className)}
        data-testid="mood-strip-loading"
      >
        <SkeletonChip />
        <SkeletonChip />
        <SkeletonChip />
        <SkeletonChip />
      </div>
    )
  }

  return (
    <div
      className={cn("flex gap-3 px-5 overflow-x-auto scrollbar-hide", className)}
      data-testid="mood-strip"
    >
      {chips.map((chip) => (
        <MoodChip
          key={chip.href}
          icon={chip.icon}
          label={chip.label}
          onClick={() => router.push(chip.href)}
        />
      ))}
    </div>
  )
}
