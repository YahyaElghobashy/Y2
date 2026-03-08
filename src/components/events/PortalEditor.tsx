"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { colors } from "@/lib/theme"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Eye, GripVertical, ChevronDown } from "lucide-react"
import { usePortalPages } from "@/lib/hooks/use-portal-pages"
import { SECTION_TYPE_META } from "@/lib/portal-section-schemas"
import type { SectionType, PortalPage, PortalSection } from "@/lib/types/portal.types"

// ── Props ──

export type PortalEditorProps = {
  portalId: string
  onPreview?: () => void
  /** Render a section editor component for the given section */
  renderSectionEditor?: (section: PortalSection, onContentChange: (content: Record<string, unknown>) => void) => React.ReactNode
}

// ── Section Type Groups for the add picker ──

const SECTION_GROUPS = [
  { label: "Content", types: ["hero", "welcome", "event_cards", "timeline", "countdown", "calendar", "dress_code", "gallery"] as SectionType[] },
  { label: "Travel", types: ["map", "transport", "hotels", "restaurants", "activities", "beauty", "travel_tips", "guides_hub"] as SectionType[] },
  { label: "Interactive", types: ["rsvp_form", "gift_registry", "cta"] as SectionType[] },
  { label: "Utility", types: ["faq", "text", "quote", "divider", "custom_html"] as SectionType[] },
]

// ── Component ──

export function PortalEditor({ portalId, onPreview, renderSectionEditor }: PortalEditorProps) {
  const {
    pages,
    sections,
    isLoading,
    error,
    addSection,
    updateSectionContent,
    deleteSectionImmediate,
    reorderSections,
  } = usePortalPages(portalId)

  const [activePageId, setActivePageId] = useState<string | null>(null)
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "idle">("idle")

  // Auto-select first page when pages load
  const effectivePageId = activePageId ?? pages[0]?.id ?? null

  const pageSections = effectivePageId ? (sections[effectivePageId] ?? []) : []

  const handleAddSection = useCallback(
    async (sectionType: SectionType) => {
      if (!effectivePageId) return
      setShowAddPicker(false)
      await addSection(effectivePageId, sectionType)
    },
    [effectivePageId, addSection]
  )

  const handleContentChange = useCallback(
    (sectionId: string, content: Record<string, unknown>) => {
      setAutoSaveStatus("saving")
      updateSectionContent(sectionId, content)
      // Auto-save debounce is handled internally by the hook (500ms)
      // Show "saved" after a delay
      setTimeout(() => setAutoSaveStatus("saved"), 600)
    },
    [updateSectionContent]
  )

  const handleDeleteSection = useCallback(
    async (sectionId: string) => {
      await deleteSectionImmediate(sectionId)
    },
    [deleteSectionImmediate]
  )

  const handleMoveSection = useCallback(
    async (sectionId: string, direction: "up" | "down") => {
      if (!effectivePageId) return
      const current = [...pageSections]
      const idx = current.findIndex((s) => s.id === sectionId)
      if (idx < 0) return
      const newIdx = direction === "up" ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= current.length) return

      // Swap
      const reordered = [...current]
      ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
      await reorderSections(effectivePageId, reordered.map((s) => s.id))
    },
    [effectivePageId, pageSections, reorderSections]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="editor-loading">
        <div className="text-sm" style={{ color: colors.text.muted }}>Loading editor...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center" data-testid="editor-error">
        <div className="text-sm" style={{ color: colors.functional.error }}>{error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" data-testid="portal-editor">
      {/* Page Tabs (horizontal pill tabs on mobile) */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto border-b" style={{ borderColor: colors.bg.secondary }}>
        {pages.map((page: PortalPage) => (
          <button
            key={page.id}
            onClick={() => setActivePageId(page.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
              effectivePageId === page.id
                ? "font-medium"
                : "opacity-70 hover:opacity-100"
            )}
            style={{
              backgroundColor:
                effectivePageId === page.id
                  ? colors.accent.glow
                  : "transparent",
              color:
                effectivePageId === page.id
                  ? colors.accent.primary
                  : colors.text.secondary,
            }}
            data-testid={`page-tab-${page.slug}`}
          >
            {page.icon && <span>{page.icon}</span>}
            {page.title}
          </button>
        ))}

        {/* Preview + Status */}
        <div className="ms-auto flex items-center gap-2">
          {autoSaveStatus === "saving" && (
            <span className="text-xs" style={{ color: colors.text.muted }}>
              Saving...
            </span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-xs" style={{ color: colors.functional.success }}>
              Saved
            </span>
          )}
          {onPreview && (
            <Button variant="ghost" size="sm" onClick={onPreview} data-testid="preview-button">
              <Eye className="w-4 h-4 me-1" />
              Preview
            </Button>
          )}
        </div>
      </div>

      {/* Section Stack */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {pageSections.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-testid="empty-sections"
          >
            <p className="text-sm mb-3" style={{ color: colors.text.muted }}>
              No sections yet. Add your first section to get started.
            </p>
            <Button size="sm" onClick={() => setShowAddPicker(true)} data-testid="add-first-section">
              <Plus className="w-4 h-4 me-1" />
              Add Section
            </Button>
          </div>
        )}

        {pageSections.map((section: PortalSection, index: number) => {
          const meta = SECTION_TYPE_META[section.section_type]
          return (
            <div
              key={section.id}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: colors.bg.parchment, backgroundColor: colors.bg.elevated }}
              data-testid={`section-${section.section_type}-${index}`}
            >
              {/* Section Header */}
              <div
                className="flex items-center gap-2 px-3 py-2 border-b"
                style={{ borderColor: colors.bg.secondary, backgroundColor: colors.bg.secondary }}
              >
                <GripVertical className="w-4 h-4 cursor-grab" style={{ color: colors.text.muted }} />
                <span className="text-sm">{meta?.icon}</span>
                <span className="text-sm font-medium flex-1" style={{ color: colors.text.primary }}>
                  {meta?.label ?? section.section_type}
                </span>

                {/* Move up/down */}
                <button
                  onClick={() => handleMoveSection(section.id, "up")}
                  disabled={index === 0}
                  className="p-1 rounded opacity-60 hover:opacity-100 disabled:opacity-20"
                  aria-label="Move up"
                >
                  <ChevronDown className="w-3.5 h-3.5 rotate-180" style={{ color: colors.text.secondary }} />
                </button>
                <button
                  onClick={() => handleMoveSection(section.id, "down")}
                  disabled={index === pageSections.length - 1}
                  className="p-1 rounded opacity-60 hover:opacity-100 disabled:opacity-20"
                  aria-label="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: colors.text.secondary }} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="p-1 rounded opacity-60 hover:opacity-100"
                  aria-label="Delete section"
                  data-testid={`delete-section-${index}`}
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
                </button>
              </div>

              {/* Section Editor Content */}
              <div className="p-3">
                {renderSectionEditor ? (
                  renderSectionEditor(section, (content) =>
                    handleContentChange(section.id, content)
                  )
                ) : (
                  <div
                    className="text-xs py-4 text-center"
                    style={{ color: colors.text.muted }}
                  >
                    {meta?.label ?? section.section_type} editor
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Add Section Button */}
        {pageSections.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowAddPicker(true)}
            data-testid="add-section-button"
          >
            <Plus className="w-4 h-4 me-1" />
            Add Section
          </Button>
        )}
      </div>

      {/* Add Section Picker (bottom sheet) */}
      <AnimatePresence>
        {showAddPicker && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddPicker(false)}
              data-testid="add-picker-backdrop"
            />
            {/* Picker Panel */}
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl max-h-[70vh] overflow-y-auto"
              style={{ backgroundColor: colors.bg.elevated }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              data-testid="add-section-picker"
            >
              <div className="p-4">
                <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: colors.bg.parchment }} />
                <h3 className="text-base font-semibold mb-4" style={{ color: colors.text.primary }}>
                  Add Section
                </h3>
                {SECTION_GROUPS.map((group) => (
                  <div key={group.label} className="mb-4">
                    <div className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: colors.text.muted }}>
                      {group.label}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {group.types.map((type) => {
                        const meta = SECTION_TYPE_META[type]
                        return (
                          <button
                            key={type}
                            onClick={() => handleAddSection(type)}
                            className="flex items-center gap-2 p-2.5 rounded-lg text-start transition-colors hover:opacity-90"
                            style={{ backgroundColor: colors.bg.secondary }}
                            data-testid={`add-section-${type}`}
                          >
                            <span>{meta?.icon}</span>
                            <span className="text-sm" style={{ color: colors.text.primary }}>
                              {meta?.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
