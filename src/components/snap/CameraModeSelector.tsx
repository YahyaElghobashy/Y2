"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CameraMode {
  id: string
  label: string
}

interface CameraModeSelectorProps {
  modes: CameraMode[]
  activeMode: string
  onModeChange: (modeId: string) => void
  className?: string
}

export function CameraModeSelector({
  modes,
  activeMode,
  onModeChange,
  className,
}: CameraModeSelectorProps) {
  return (
    <div className={cn("flex items-center justify-center gap-6", className)}>
      {modes.map((mode) => {
        const isActive = mode.id === activeMode
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className="relative flex flex-col items-center gap-1.5 pb-2"
          >
            <span
              className={cn(
                "font-nav text-[14px] transition-colors",
                isActive
                  ? "font-bold text-white"
                  : "font-medium text-white/60"
              )}
            >
              {mode.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="camera-mode-dot"
                className="absolute -bottom-0.5 h-1.5 w-1.5 rounded-full bg-[var(--accent-copper,#B87333)]"
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
