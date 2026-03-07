"use client"

import { Plus } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { VisionItemCard } from "@/components/vision-board/VisionItemCard"
import type { CategoryWithItems } from "@/lib/types/vision-board.types"

type CategorySectionProps = {
  category: CategoryWithItems
  onAddItem?: (categoryId: string) => void
  onToggleAchieved?: (itemId: string) => void
  onRemoveItem?: (itemId: string) => void
  readOnly?: boolean
  className?: string
}

export function CategorySection({
  category,
  onAddItem,
  onToggleAchieved,
  onRemoveItem,
  readOnly = false,
  className,
}: CategorySectionProps) {
  const achievedCount = category.items.filter((i) => i.is_achieved).length

  return (
    <div className={cn("", className)} data-testid={`category-section-${category.id}`}>
      {/* Shelf-style header */}
      <div className="flex items-center gap-3 px-6 mb-4">
        <span className="text-[22px]">{category.icon}</span>
        <div className="flex-1">
          <h3
            className="text-[13px] font-bold uppercase tracking-[0.15em] font-display"
            style={{ color: "var(--accent-copper, #B87333)" }}
          >
            {category.name}
          </h3>
        </div>
        <span
          className="text-[11px] font-medium"
          style={{ color: "var(--text-muted, #B5ADA4)" }}
        >
          {achievedCount}/{category.items.length}
        </span>
      </div>

      {/* Shelf line */}
      <div
        className="mx-6 mb-4 h-px"
        style={{
          background:
            "linear-gradient(90deg, var(--accent-copper, #B87333) 0%, rgba(184,115,51,0.1) 100%)",
        }}
      />

      {/* Horizontal scroll of polaroid items */}
      <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide">
        {category.items.map((item) => (
          <VisionItemCard
            key={item.id}
            item={item}
            onToggleAchieved={onToggleAchieved}
            onRemove={onRemoveItem}
            readOnly={readOnly}
          />
        ))}

        {/* Add button — polaroid-style dashed */}
        {!readOnly && (
          <motion.button
            className={cn(
              "w-[150px] flex-shrink-0 rounded-sm",
              "flex flex-col items-center justify-center gap-2",
              "transition-colors"
            )}
            style={{
              padding: "8px 8px 32px 8px",
              border: "2px dashed rgba(184,115,51,0.25)",
              color: "var(--text-muted, #B5ADA4)",
              aspectRatio: "auto",
              minHeight: "180px",
            }}
            whileTap={{ scale: 0.97 }}
            whileHover={{
              borderColor: "rgba(184,115,51,0.5)",
              color: "var(--accent-copper, #B87333)",
            }}
            onClick={() => onAddItem?.(category.id)}
            data-testid={`add-item-${category.id}`}
          >
            <Plus size={24} />
            <span className="text-[12px] font-medium">Add Vision</span>
          </motion.button>
        )}
      </div>
    </div>
  )
}
