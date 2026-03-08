"use client"

import { colors } from "@/lib/theme"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function DividerEditor({ content, onContentChange }: SectionEditorProps) {
  const style = (content.style as string) ?? "line"
  const spacing = (content.spacing as string) ?? "md"

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="divider-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Style
        </label>
        <select
          value={style}
          onChange={(e) => update("style", e.target.value)}
          className={fieldStyles.select}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="divider-style"
        >
          <option value="line">Line</option>
          <option value="dots">Dots</option>
          <option value="ornament">Ornament</option>
          <option value="space">Space Only</option>
        </select>
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Spacing
        </label>
        <select
          value={spacing}
          onChange={(e) => update("spacing", e.target.value)}
          className={fieldStyles.select}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="divider-spacing"
        >
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </div>
    </div>
  )
}
