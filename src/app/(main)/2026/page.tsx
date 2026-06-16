"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CalendarCheck } from "lucide-react"
import { motion } from "framer-motion"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { VisionBoardWizard } from "@/components/vision-board/VisionBoardWizard"
import { AddVisionItemForm } from "@/components/vision-board/AddVisionItemForm"
import { VisionView, type Board, type VisionCategory } from "@/components/vision-board/VisionView"
import { useVisionBoard } from "@/lib/hooks/use-vision-board"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { CategoryWithItems, VisionBoard } from "@/lib/types/vision-board.types"

// Deterministic accent cycle so each category gets a stable poster colour.
const ACCENTS: VisionCategory["accent"][] = ["teal", "amber", "coral", "rose", "indigo"]

/** Map the active board's loaded categories → the redesigned view's Board shape. */
function toBoard(
  board: VisionBoard | null,
  categories: CategoryWithItems[],
): Board {
  return {
    theme: board?.theme ?? board?.title ?? "",
    categories: categories.map((cat, i) => ({
      name: cat.name,
      emoji: cat.icon,
      accent: ACCENTS[i % ACCENTS.length],
      items: cat.items.map((it) => ({
        text: it.title,
        done: it.is_achieved,
        id: it.id,
      })),
    })),
  }
}

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
    createBoard,
    addCategory,
  } = useVisionBoard()

  const [addOpen, setAddOpen] = useState(false)

  const partnerName = partner?.display_name ?? "Partner"
  const isPartnerView = activeBoard === "partner"

  // The hook only loads categories for the active board, so the active tab gets
  // real data and the inactive tab is empty until the user switches (which
  // triggers the hook to reload). Themes for both boards load up-front.
  const mineBoardData: Board = useMemo(
    () =>
      activeBoard === "mine"
        ? toBoard(myBoard, categories)
        : { theme: myBoard?.theme ?? myBoard?.title ?? "", categories: [] },
    [activeBoard, myBoard, categories],
  )
  const partnerBoardData: Board = useMemo(
    () =>
      activeBoard === "partner"
        ? toBoard(partnerBoard, categories)
        : { theme: partnerBoard?.theme ?? partnerBoard?.title ?? "", categories: [] },
    [activeBoard, partnerBoard, categories],
  )

  // Show wizard if user has no board (preserved from the old page).
  if (!isLoading && !myBoard && activeBoard === "mine") {
    return (
      <PageTransition>
        <PageHeader title="2026" backHref="/keepsake" />
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
        <PageHeader title="2026" backHref="/keepsake" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      {/* Monthly evaluation prompt — routes to the existing /2026/evaluate flow. */}
      {!isPartnerView && myBoard && !hasEvaluatedThisMonth && (
        <Link href="/2026/evaluate" className="block px-5 pt-5">
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "rgba(184,115,51,0.08)",
              border: "1px solid rgba(184,115,51,0.15)",
            }}
            data-testid="eval-prompt"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2" style={{ backgroundColor: "rgba(184,115,51,0.15)" }}>
                <CalendarCheck size={20} style={{ color: "var(--accent-copper, #B87333)" }} />
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-primary)]">Time for your monthly check-in</h4>
                <p className="text-xs italic text-[var(--text-muted)]" style={{ fontFamily: "var(--font-serif)" }}>
                  &ldquo;Progress is quiet but powerful&rdquo;
                </p>
              </div>
            </div>
            <motion.div
              className="mt-4 w-full rounded-xl py-3 text-center font-bold text-white shadow-lg"
              style={{ backgroundColor: "var(--accent-copper, #B87333)", boxShadow: "0 4px 14px rgba(184,115,51,0.2)" }}
              whileTap={{ scale: 0.98 }}
            >
              Evaluate Now
            </motion.div>
          </div>
        </Link>
      )}

      <VisionView
        mine={mineBoardData}
        partner={partnerBoardData}
        partnerName={partnerName}
        activeTab={activeBoard}
        onTabChange={switchBoard}
        onToggleItem={toggleAchieved}
        // Open the proven add-item bottom sheet; needs at least one category.
        onAddGoal={categories.length > 0 ? () => setAddOpen(true) : undefined}
      />

      {addOpen && categories.length > 0 && (
        <AddVisionItemForm
          categoryId={categories[0].id}
          categories={categories}
          onSave={async (categoryId, data) => {
            await addItem(categoryId, data)
          }}
          onClose={() => setAddOpen(false)}
        />
      )}
    </PageTransition>
  )
}
