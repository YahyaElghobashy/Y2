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
  return (
    <div className={cn("", className)} data-testid={`category-section-${category.id}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[20px]">{category.icon}</span>
          <h3 className="text-[16px] font-semibold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)]">
            {category.name}
          </h3>
        </div>
        <span className="text-[12px] text-[var(--color-text-muted,#B5ADA4)]">
          {category.items.length} {category.items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Horizontal scroll of items */}
      <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
        {category.items.map((item) => (
          <VisionItemCard
            key={item.id}
            item={item}
            onToggleAchieved={onToggleAchieved}
            onRemove={onRemoveItem}
            readOnly={readOnly}
          />
        ))}

        {/* Add button */}
        {!readOnly && (
          <motion.button
            className={cn(
              "w-[140px] h-[140px] flex-shrink-0 rounded-2xl",
              "border-2 border-dashed border-[var(--color-border-subtle,#E8E2DA)]",
              "flex flex-col items-center justify-center gap-2",
              "text-[var(--color-text-muted,#B5ADA4)]",
              "hover:border-[var(--accent-primary,#C4956A)] hover:text-[var(--accent-primary,#C4956A)]",
              "transition-colors"
            )}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddItem?.(category.id)}
            data-testid={`add-item-${category.id}`}
          >
            <Plus size={24} />
            <span className="text-[12px] font-medium">Add</span>
          </motion.button>
        )}
      </div>
    </div>
  )
}
