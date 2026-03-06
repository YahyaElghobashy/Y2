import { cn } from "@/lib/utils"

type GradientDividerProps = {
  className?: string
  glow?: boolean
}

export function GradientDivider({ className, glow = false }: GradientDividerProps) {
  return (
    <div
      className={cn("h-px w-full", className)}
      style={{
        background: "linear-gradient(90deg, transparent, var(--accent-soft, #E8D5C0), transparent)",
        boxShadow: glow
          ? "0 0 8px rgba(184, 115, 51, 0.12), 0 0 2px rgba(184, 115, 51, 0.08)"
          : undefined,
      }}
      aria-hidden="true"
    />
  )
}
