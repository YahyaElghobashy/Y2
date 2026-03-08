"use client"

import { colors } from "@/lib/theme"
import { Plus, Trash2 } from "lucide-react"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function WelcomeEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const body = (content.body as string) ?? ""
  const imageUrl = (content.image_url as string) ?? ""
  const imagePosition = (content.image_position as string) ?? "right"
  const signatures = (content.signatures as string[]) ?? []

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="welcome-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Welcome to our celebration"
          data-testid="welcome-heading"
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
          placeholder="Write your welcome message..."
          rows={4}
          data-testid="welcome-body"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Image URL
        </label>
        <input
          value={imageUrl}
          onChange={(e) => update("image_url", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="https://..."
          data-testid="welcome-image-url"
        />
      </div>

      {imageUrl && (
        <div>
          <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
            Image Position
          </label>
          <select
            value={imagePosition}
            onChange={(e) => update("image_position", e.target.value)}
            className={fieldStyles.select}
            style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
            data-testid="welcome-image-position"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      )}

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Signatures
        </label>
        {signatures.map((sig, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input
              value={sig}
              onChange={(e) => {
                const updated = [...signatures]
                updated[i] = e.target.value
                update("signatures", updated)
              }}
              className={fieldStyles.input}
              style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
              placeholder="e.g. With love, Sarah & James"
              data-testid={`welcome-signature-${i}`}
            />
            <button
              onClick={() => update("signatures", signatures.filter((_, idx) => idx !== i))}
              className="p-1.5 rounded"
              data-testid={`welcome-remove-signature-${i}`}
            >
              <Trash2 className="w-3.5 h-3.5" style={{ color: colors.functional.error }} />
            </button>
          </div>
        ))}
        <button
          onClick={() => update("signatures", [...signatures, ""])}
          className={fieldStyles.addBtn}
          style={{ borderColor: colors.bg.parchment, color: colors.text.secondary }}
          data-testid="welcome-add-signature"
        >
          <Plus className="w-3.5 h-3.5 inline me-1" />
          Add Signature
        </button>
      </div>
    </div>
  )
}
