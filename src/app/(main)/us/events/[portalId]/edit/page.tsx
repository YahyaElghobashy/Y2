"use client"

import { useParams, useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { colors } from "@/lib/theme"
import { Button } from "@/components/ui/button"
import { PortalEditor } from "@/components/events/PortalEditor"
import { getSectionEditor } from "@/components/events/editors"
import { useEventPortal } from "@/lib/hooks/use-event-portal"

export default function PortalEditPage() {
  const params = useParams()
  const router = useRouter()
  const portalId = params.portalId as string

  // Pull the portal so we can resolve its public slug for the Preview action.
  const { portals } = useEventPortal()
  const portal = portals.find((p) => p.id === portalId) ?? null

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: colors.bg.secondary }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/us/events/${portalId}`)}
          data-testid="edit-back"
        >
          <ChevronLeft className="w-4 h-4 me-1" />
          Back
        </Button>
        <h1 className="text-base font-semibold" style={{ color: colors.text.primary }}>
          {portal?.title ?? "Edit Portal"}
        </h1>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <PortalEditor
          portalId={portalId}
          onPreview={
            portal
              ? () => window.open(`/e/${portal.slug}`, "_blank", "noopener,noreferrer")
              : undefined
          }
          renderSectionEditor={(section, onContentChange) => {
            const Editor = getSectionEditor(section.section_type)
            if (!Editor) return null
            return (
              <Editor content={section.content} onContentChange={onContentChange} />
            )
          }}
        />
      </div>
    </div>
  )
}
