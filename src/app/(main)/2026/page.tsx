"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CalendarCheck } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { MediaImage } from "@/components/shared/MediaImage"
import { CategorySection } from "@/components/vision-board/CategorySection"
import { VisionBoardWizard } from "@/components/vision-board/VisionBoardWizard"
import { AddVisionItemForm } from "@/components/vision-board/AddVisionItemForm"
import { useVisionBoard } from "@/lib/hooks/use-vision-board"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { ActiveBoard } from "@/lib/types/vision-board.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export default function VisionBoardPage() {
  const { partner } = useAuth()
  const {
    myBoard,
    partnerBoard,
    categories,
    isLoading,
    activeBoard,
    switchBoard,
    currentBoard,
    hasEvaluatedThisMonth,
    addItem,
    toggleAchieved,
    removeItem,
    createBoard,
    addCategory,
  } = useVisionBoard()

  const [addItemCategoryId, setAddItemCategoryId] = useState<string | null>(null)

  const isPartnerView = activeBoard === "partner"
  const partnerName = partner?.display_name ?? "Partner"
  const boardTabs: { key: ActiveBoard; label: string }[] = [
    { key: "mine", label: "My Board" },
    { key: "partner", label: `${partnerName}'s Board` },
  ]

  // Show wizard if user has no board
  if (!isLoading && !myBoard && activeBoard === "mine") {
    return (
      <PageTransition>
        <PageHeader title="2026" />
        <VisionBoardWizard
          onComplete={async (data) => {
            const boardId = await createBoard({ title: data.title, theme: data.theme })
            if (boardId) {
              for (const cat of data.categories) {
                await addCategory(boardId, cat.name, cat.icon)
              }
            }
          }}
        />
      </PageTransition>
    )
  }

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="2026" />
        <LoadingSkeleton variant="full-page" />
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageHeader title="2026" />

      {/* Board switcher */}
      <div className="flex gap-2 px-5 mt-2 mb-4">
        {boardTabs.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              "relative px-4 py-2 rounded-xl text-[13px] font-medium transition-colors",
              "font-[family-name:var(--font-body)]"
            )}
            onClick={() => switchBoard(tab.key)}
            data-testid={`board-tab-${tab.key}`}
          >
            {activeBoard === tab.key && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-[var(--accent-primary,#C4956A)]"
                layoutId="board-tab-indicator"
                transition={{ duration: 0.25, ease: EASE_OUT }}
              />
            )}
            <span
              className={cn(
                "relative z-10",
                activeBoard === tab.key
                  ? "text-white"
                  : "text-[var(--color-text-secondary,#8C8279)]"
              )}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Hero banner */}
      {currentBoard && (
        <div className="px-5 mb-5">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
            {currentBoard.hero_media_id ? (
              <MediaImage
                mediaId={currentBoard.hero_media_id}
                alt={currentBoard.title}
                fill
                objectFit="cover"
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--accent-soft,#E8D5C0)] to-[var(--color-bg-secondary,#F5F0E8)]" />
            )}

            {/* Title overlay */}
            <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-12 bg-gradient-to-t from-black/50 to-transparent">
              <h2 className="text-[24px] font-bold font-[family-name:var(--font-display)] text-white">
                {currentBoard.title}
              </h2>
              {currentBoard.theme && (
                <p className="text-[14px] italic text-white/80 mt-0.5">
                  {currentBoard.theme}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monthly evaluation prompt */}
      {!isPartnerView && myBoard && !hasEvaluatedThisMonth && (
        <Link href="/2026/evaluate" className="block px-5 mb-5">
          <motion.div
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl",
              "bg-[var(--accent-soft,#E8D5C0)]/30 border border-[var(--accent-primary,#C4956A)]/20"
            )}
            whileTap={{ scale: 0.99 }}
            data-testid="eval-prompt"
          >
            <CalendarCheck size={20} className="text-[var(--accent-primary,#C4956A)]" />
            <div>
              <p className="text-[13px] font-medium text-[var(--color-text-primary,#2C2825)]">
                Monthly reflection due
              </p>
              <p className="text-[11px] text-[var(--color-text-muted,#B5ADA4)]">
                How did this month go for your vision?
              </p>
            </div>
          </motion.div>
        </Link>
      )}

      {/* Categories */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBoard}
          className="flex flex-col gap-6 pb-8"
          initial={{ opacity: 0, x: activeBoard === "mine" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeBoard === "mine" ? 20 : -20 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
        >
          {categories.length > 0 ? (
            categories.map((cat) => (
              <CategorySection
                key={cat.id}
                category={cat}
                onAddItem={(catId) => setAddItemCategoryId(catId)}
                onToggleAchieved={toggleAchieved}
                onRemoveItem={removeItem}
                readOnly={isPartnerView}
              />
            ))
          ) : currentBoard ? (
            <div className="flex flex-col items-center justify-center py-12 px-5">
              <Sparkles size={40} strokeWidth={1.25} className="text-[var(--color-text-muted,#B5ADA4)] mb-3" />
              <p className="text-[14px] text-[var(--color-text-muted,#B5ADA4)] text-center">
                {isPartnerView
                  ? `${partnerName} hasn't added categories yet`
                  : "Add categories to start building your vision"}
              </p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Add item bottom sheet */}
      {addItemCategoryId && (
        <AddVisionItemForm
          categoryId={addItemCategoryId}
          categories={categories}
          onSave={async (categoryId, data) => {
            await addItem(categoryId, data)
          }}
          onClose={() => setAddItemCategoryId(null)}
        />
      )}
    </PageTransition>
  )
}
