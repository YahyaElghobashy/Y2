"use client"

import { colors } from "@/lib/theme"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function QuoteEditor({ content, onContentChange }: SectionEditorProps) {
  const text = (content.text as string) ?? ""
  const attribution = (content.attribution as string) ?? ""
  const style = (content.style as string) ?? "simple"

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="quote-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Quote Text *
        </label>
        <textarea
          value={text}
          onChange={(e) => update("text", e.target.value)}
          className={fieldStyles.textarea}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="Enter your quote..."
          rows={3}
          data-testid="quote-text"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Attribution
        </label>
        <input
          value={attribution}
          onChange={(e) => update("attribution", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. — Rumi"
          data-testid="quote-attribution"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Style
        </label>
        <select
          value={style}
          onChange={(e) => update("style", e.target.value)}
          className={fieldStyles.select}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="quote-style"
        >
          <option value="simple">Simple</option>
          <option value="decorative">Decorative</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  )
}
