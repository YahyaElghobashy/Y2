"use client"

import { colors } from "@/lib/theme"
import { Switch } from "@/components/ui/switch"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function HeroEditor({ content, onContentChange }: SectionEditorProps) {
  const heading = (content.heading as string) ?? ""
  const subheading = (content.subheading as string) ?? ""
  const backgroundImageUrl = (content.background_image_url as string) ?? ""
  const backgroundOverlayOpacity = (content.background_overlay_opacity as number) ?? 0.4
  const dateDisplay = (content.date_display as string) ?? ""
  const layout = (content.layout as string) ?? "centered"
  const showCountdown = (content.show_countdown as boolean) ?? false
  const ctaText = (content.cta_text as string) ?? ""
  const ctaLink = (content.cta_link as string) ?? ""

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="hero-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Heading *
        </label>
        <input
          value={heading}
          onChange={(e) => update("heading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. Sarah & James"
          data-testid="hero-heading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Subheading
        </label>
        <input
          value={subheading}
          onChange={(e) => update("subheading", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. We're getting married!"
          data-testid="hero-subheading"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Date Display
        </label>
        <input
          value={dateDisplay}
          onChange={(e) => update("date_display", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. June 15, 2026"
          data-testid="hero-date-display"
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
          data-testid="hero-layout"
        >
          <option value="centered">Centered</option>
          <option value="left">Left Aligned</option>
          <option value="split">Split</option>
        </select>
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          Background Image URL
        </label>
        <input
          value={backgroundImageUrl}
          onChange={(e) => update("background_image_url", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="https://..."
          data-testid="hero-bg-image"
        />
      </div>

      {backgroundImageUrl && (
        <div>
          <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
            Overlay Opacity ({Math.round(backgroundOverlayOpacity * 100)}%)
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={backgroundOverlayOpacity}
            onChange={(e) => update("background_overlay_opacity", parseFloat(e.target.value))}
            className="w-full"
            data-testid="hero-overlay-opacity"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium" style={{ color: colors.text.secondary }}>
          Show Countdown
        </label>
        <Switch
          checked={showCountdown}
          onCheckedChange={(v) => update("show_countdown", v)}
          data-testid="hero-show-countdown"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          CTA Button Text
        </label>
        <input
          value={ctaText}
          onChange={(e) => update("cta_text", e.target.value)}
          className={fieldStyles.input}
          style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
          placeholder="e.g. RSVP Now"
          data-testid="hero-cta-text"
        />
      </div>

      {ctaText && (
        <div>
          <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
            CTA Link
          </label>
          <input
            value={ctaLink}
            onChange={(e) => update("cta_link", e.target.value)}
            className={fieldStyles.input}
            style={{ borderColor: colors.bg.parchment, color: colors.text.primary }}
            placeholder="#rsvp or https://..."
            data-testid="hero-cta-link"
          />
        </div>
      )}
    </div>
  )
}
