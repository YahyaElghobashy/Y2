"use client"

import { colors } from "@/lib/theme"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function CTAEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const buttonText = (content.button_text as string) ?? ""
  const buttonUrl = (content.button_url as string) ?? ""
  const buttonStyle = (content.button_style as string) ?? "primary"
  const backgroundColor = (content.background_color as string) ?? ""
  const imageUrl = (content.image_url as string) ?? ""

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="cta-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading *
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Ready to celebrate?"
          data-testid="cta-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => update("description", e.target.value)}
          className={fieldStyles.textarea}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="Supporting text..."
          rows={2}
          data-testid="cta-description"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Button Text *
        </label>
        <input
          value={buttonText}
          onChange={(e) => update("button_text", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. RSVP Now"
          data-testid="cta-button-text"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Button URL *
        </label>
        <input
          value={buttonUrl}
          onChange={(e) => update("button_url", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="#rsvp or https://..."
          data-testid="cta-button-url"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Button Style
        </label>
        <select
          value={buttonStyle}
          onChange={(e) => update("button_style", e.target.value)}
          className={fieldStyles.select}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          data-testid="cta-button-style"
        >
          <option value="primary">Primary (Filled)</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Background Color
        </label>
        <input
          value={backgroundColor}
          onChange={(e) => update("background_color", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="#F5EDE3"
          data-testid="cta-bg-color"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Background Image URL
        </label>
        <input
          value={imageUrl}
          onChange={(e) => update("image_url", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="https://..."
          data-testid="cta-image-url"
        />
      </div>
    </div>
  )
}
