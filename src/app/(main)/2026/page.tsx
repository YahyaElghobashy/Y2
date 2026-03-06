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
      <div className="texture-cork min-h-screen pb-8">
        <PageHeader title="2026 Vision Board" />

        {/* Board switcher pills */}
        <div className="px-4 pb-4">
          <div
            className="flex h-10 flex-1 items-center justify-center rounded-xl p-1 gap-1"
            style={{ backgroundColor: "rgba(44,40,37,0.05)" }}
          >
            {boardTabs.map((tab) => (
              <button
                key={tab.key}
                className={cn(
                  "relative flex-1 h-full flex items-center justify-center rounded-lg px-2 text-sm font-semibold transition-all"
                )}
                onClick={() => switchBoard(tab.key)}
                data-testid={`board-tab-${tab.key}`}
              >
                {activeBoard === tab.key && (
                  <motion.div
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
                    layoutId="board-tab-indicator"
                    transition={{ duration: 0.25, ease: EASE_OUT }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 truncate",
                    activeBoard === tab.key
                      ? "text-white"
                      : "text-[var(--text-secondary)]"
                  )}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Full-bleed hero banner */}
        {currentBoard && (
          <div className="relative h-[40vh] w-full overflow-hidden mb-6">
            {currentBoard.hero_media_id ? (
              <MediaImage
                mediaId={currentBoard.hero_media_id}
                alt={currentBoard.title}
                fill
                objectFit="cover"
                className="w-full h-full mix-blend-overlay"
              />
            ) : null}
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: currentBoard.hero_media_id
                  ? "rgba(0,0,0,0.2)"
                  : "linear-gradient(135deg, var(--accent-copper, #B87333) 0%, var(--bg-warm-white, #FFFDF9) 50%, var(--gold, #DAA520) 100%)",
              }}
            />
            {/* Title */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <h2
                className="font-[family-name:var(--font-display)] text-[32px] leading-tight text-white font-bold mb-2"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
              >
                {currentBoard.title || "My 2026 Vision"}
              </h2>
              {currentBoard.theme && (
                <p
                  className="font-[family-name:var(--font-display)] italic text-white/90 text-lg"
                  style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
                >
                  {currentBoard.theme}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Monthly evaluation prompt */}
        {!isPartnerView && myBoard && !hasEvaluatedThisMonth && (
          <Link href="/2026/evaluate" className="block px-6 mb-6">
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: "rgba(184,115,51,0.08)",
                border: "1px solid rgba(184,115,51,0.15)",
              }}
              data-testid="eval-prompt"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: "rgba(184,115,51,0.15)" }}
                >
                  <CalendarCheck size={20} style={{ color: "var(--accent-copper, #B87333)" }} />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--text-primary)]">
                    Time for your monthly check-in
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] italic">
                    &ldquo;Progress is quiet but powerful&rdquo;
                  </p>
                </div>
              </div>
              <motion.button
                className="w-full py-3 rounded-xl text-white font-bold shadow-lg"
                style={{
                  backgroundColor: "var(--accent-copper, #B87333)",
                  boxShadow: "0 4px 14px rgba(184,115,51,0.2)",
                }}
                whileTap={{ scale: 0.98 }}
              >
                Evaluate Now
              </motion.button>
            </div>
          </Link>
        )}

        {/* Categories */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBoard}
            className="space-y-8"
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
                <Sparkles size={40} strokeWidth={1.25} className="text-[var(--text-muted)] mb-3" />
                <p className="text-[14px] text-[var(--text-muted)] text-center">
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
      </div>
    </PageTransition>
  )
}
