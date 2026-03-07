"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { MediaImage } from "@/components/shared/MediaImage"
import type { VisionItem } from "@/lib/types/vision-board.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type VisionItemCardProps = {
  item: VisionItem
  onToggleAchieved?: (itemId: string) => void
  onRemove?: (itemId: string) => void
  readOnly?: boolean
  className?: string
}

/** Deterministic rotation from item ID so it's consistent across renders */
function getRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return ((hash % 5) - 2) // -2 to +2 degrees
}

export function VisionItemCard({
  item,
  onToggleAchieved,
  onRemove,
  readOnly = false,
  className,
}: VisionItemCardProps) {
  const rotation = useMemo(() => getRotation(item.id), [item.id])

  return (
    <motion.div
      className={cn(
        "relative w-[150px] flex-shrink-0",
        className
      )}
      style={{ rotate: `${rotation}deg` }}
      whileTap={!readOnly ? { scale: 0.97 } : undefined}
      whileHover={{ scale: 1.03, rotate: "0deg" }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      onClick={() => !readOnly && onToggleAchieved?.(item.id)}
      role={!readOnly ? "button" : undefined}
      tabIndex={!readOnly ? 0 : undefined}
      data-testid={`vision-item-card-${item.id}`}
      layout
    >
      {/* Polaroid frame */}
      <div
        className="rounded-sm overflow-hidden"
        style={{
          padding: "8px 8px 32px 8px",
          backgroundColor: item.is_achieved
            ? "rgba(218,165,32,0.08)"
            : "white",
          border: item.is_achieved
            ? "2px solid var(--gold, #DAA520)"
            : "1px solid rgba(44,40,37,0.06)",
          boxShadow: item.is_achieved
            ? "0 4px 14px rgba(218,165,32,0.15), var(--shadow-warm-md, 0 2px 6px rgba(44,40,37,0.08))"
            : "var(--shadow-warm-md, 0 2px 8px rgba(44,40,37,0.08), 0 1px 3px rgba(44,40,37,0.04))",
        }}
      >
        {/* Image area */}
        <div
          className="relative w-full overflow-hidden rounded-sm"
          style={{
            aspectRatio: "1",
            backgroundColor: "var(--bg-soft-cream, #F5EDE3)",
          }}
        >
          {item.media_id ? (
            <MediaImage
              mediaId={item.media_id}
              alt={item.title}
              className="w-full h-full object-cover"
              fill
              objectFit="cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <p
                className="text-[13px] font-medium leading-tight text-center text-[var(--text-primary,#2C2825)]"
              >
                {item.title}
              </p>
            </div>
          )}
        </div>

        {/* Caption area (below image, inside polaroid border) */}
        {item.media_id && (
          <p
            className="mt-2 text-[11px] font-handwritten text-[var(--text-secondary,#6B6560)] leading-tight line-clamp-2 text-center"
          >
            {item.title}
          </p>
        )}
      </div>

      {/* Achieved checkmark badge */}
      {item.is_achieved && (
        <motion.div
          className="absolute -top-2 -end-2 w-7 h-7 rounded-full flex items-center justify-center z-10"
          style={{
            backgroundColor: "var(--gold, #DAA520)",
            boxShadow: "0 2px 8px rgba(218,165,32,0.3)",
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <Check size={14} className="text-white" strokeWidth={2.5} />
        </motion.div>
      )}
    </motion.div>
  )
}
