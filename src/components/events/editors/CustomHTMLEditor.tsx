"use client"

import { colors } from "@/lib/theme"
import { Switch } from "@/components/ui/switch"
import type { SectionEditorProps } from "./editor-types"
import { fieldStyles } from "./editor-types"

export function CustomHTMLEditor({ content, onContentChange }: SectionEditorProps) {
  const html = (content.html as string) ?? ""
  const css = (content.css as string) ?? ""
  const sandbox = (content.sandbox as boolean) ?? true

  const update = (field: string, value: unknown) => {
    onContentChange({ ...content, [field]: value })
  }

  return (
    <div className="space-y-3" data-testid="custom-html-editor">
      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          HTML *
        </label>
        <textarea
          value={html}
          onChange={(e) => update("html", e.target.value)}
          className={fieldStyles.textarea}
          style={{
            borderColor: colors.bg.parchment,
            color: colors.text.primary,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
          }}
          placeholder="<div>Your custom HTML...</div>"
          rows={8}
          data-testid="custom-html-html"
        />
      </div>

      <div>
        <label className={fieldStyles.label} style={{ color: colors.text.secondary }}>
          CSS
        </label>
        <textarea
          value={css}
          onChange={(e) => update("css", e.target.value)}
          className={fieldStyles.textarea}
          style={{
            borderColor: colors.bg.parchment,
            color: colors.text.primary,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
          }}
          placeholder=".my-class { color: red; }"
          rows={4}
          data-testid="custom-html-css"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium block" style={{ color: colors.text.secondary }}>
            Sandbox Mode
          </span>
          <span className="text-xs" style={{ color: colors.text.muted }}>
            Isolates HTML in an iframe for safety
          </span>
        </div>
        <Switch
          checked={sandbox}
          onCheckedChange={(v) => update("sandbox", v)}
          data-testid="custom-html-sandbox"
        />
      </div>
    </div>
  )
}
