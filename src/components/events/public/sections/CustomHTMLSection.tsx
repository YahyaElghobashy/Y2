"use client"

import { useRef, useEffect } from "react"
import type { PortalSection } from "@/lib/types/portal.types"

type Props = { section: PortalSection }

export function CustomHTMLSection({ section }: Props) {
  const html = (section.content.html as string) ?? ""
  const css = (section.content.css as string) ?? ""
  const sandbox = (section.content.sandbox as boolean) ?? true
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!sandbox || !iframeRef.current) return

    const doc = iframeRef.current.contentDocument
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { margin: 0; font-family: sans-serif; }
            ${css}
          </style>
        </head>
        <body>${html}</body>
      </html>
    `)
    doc.close()
  }, [html, css, sandbox])

  if (!html) return null

  if (sandbox) {
    return (
      <div className="mx-auto max-w-3xl px-4" data-testid="custom-html-section">
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          className="w-full border-0"
          style={{
            minHeight: "200px",
            borderRadius: "var(--portal-radius)",
          }}
          title="Custom content"
        />
      </div>
    )
  }

  // Non-sandboxed: render directly (use with caution)
  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="custom-html-section">
      {css && <style>{css}</style>}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
