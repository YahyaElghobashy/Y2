"use client"

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

export function VisionItemCard({
  item,
  onToggleAchieved,
  onRemove,
  readOnly = false,
  className,
}: VisionItemCardProps) {
  return (
    <motion.div
      className={cn(
        "relative w-[140px] h-[140px] flex-shrink-0 rounded-2xl overflow-hidden",
        "bg-[var(--color-bg-secondary,#F5F0E8)]",
        item.is_achieved && "ring-2 ring-[var(--accent-primary,#C4956A)]",
        className
      )}
      whileTap={!readOnly ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      onClick={() => !readOnly && onToggleAchieved?.(item.id)}
      role={!readOnly ? "button" : undefined}
      tabIndex={!readOnly ? 0 : undefined}
      data-testid={`vision-item-card-${item.id}`}
      layout
    >
      {/* Image or text */}
      {item.media_id ? (
        <MediaImage
          mediaId={item.media_id}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover"
          fill
          objectFit="cover"
        />
      ) : null}

      {/* Title overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 px-2 pb-2 pt-8",
          item.media_id
            ? "bg-gradient-to-t from-black/60 to-transparent"
            : "flex items-center justify-center inset-0 pt-2"
        )}
      >
        <p
          className={cn(
            "text-[12px] font-medium leading-tight line-clamp-3",
            item.media_id
              ? "text-white"
              : "text-[var(--color-text-primary,#2C2825)] text-center text-[13px]"
          )}
        >
          {item.title}
        </p>
      </div>

      {/* Achieved checkmark badge */}
      {item.is_achieved && (
        <motion.div
          className="absolute top-2 end-2 w-6 h-6 rounded-full bg-[var(--accent-primary,#C4956A)] flex items-center justify-center"
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
