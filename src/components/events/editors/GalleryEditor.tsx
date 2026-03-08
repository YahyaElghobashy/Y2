"use client"

import { colors } from "@/lib/theme"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function GalleryEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const layout = (content.layout as string) ?? "grid"
  const columns = (content.columns as number) ?? 3

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="gallery-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Photo Gallery"
          data-testid="gallery-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Layout
        </label>
        <select
          value={layout}
          onChange={(e) => update("layout", e.target.value)}
          className={fieldStyles.select}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="gallery-layout"
        >
          <option value="grid">Grid</option>
          <option value="masonry">Masonry</option>
          <option value="carousel">Carousel</option>
        </select>
      </div>

      {layout !== "carousel" && (
        <div>
          <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
            Columns ({columns})
          </label>
          <input
            type="range"
            min={1}
            max={6}
            value={columns}
            onChange={(e) => update("columns", parseInt(e.target.value))}
            className="w-full"
            data-testid="gallery-columns"
          />
        </div>
      )}

      <p className="text-xs" style={{ color: colors.text.muted }}>
        Photos are managed in the Media section of the portal settings.
      </p>
    </div>
  )
}
