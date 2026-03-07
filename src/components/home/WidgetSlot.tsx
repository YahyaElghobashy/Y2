import { cn } from "@/lib/utils"

type WidgetSlotProps = {
  label?: string
  className?: string
}

export function WidgetSlot({ label = "Widget coming soon", className }: WidgetSlotProps) {
  return (
    <div
      className={cn(
        "flex h-[100px] items-center justify-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-6 shadow-[0_2px_12px_rgba(44,40,37,0.06)]",
        className
      )}
    >
      <p className="font-body text-[14px] font-medium text-[var(--color-text-muted)]">
        {label}
      </p>
    </div>
  )
}
