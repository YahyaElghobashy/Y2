"use client"

import { colors } from "@/lib/theme"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function TextEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const body = (content.body as string) ?? ""
  const alignment = (content.alignment as string) ?? "left"

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="text-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="Optional heading"
          data-testid="text-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Body *
        </label>
        <textarea
          value={body}
          onChange={(e) => update("body", e.target.value)}
          className={fieldStyles.textarea}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="Write your content..."
          rows={5}
          data-testid="text-body"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Alignment
        </label>
        <select
          value={alignment}
          onChange={(e) => update("alignment", e.target.value)}
          className={fieldStyles.select}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="text-alignment"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  )
}
