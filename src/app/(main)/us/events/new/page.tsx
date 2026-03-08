"use client"

import { useRouter } from "next/navigation"
import { useEventPortal } from "@/lib/hooks/use-event-portal"
import { PortalCreationWizard } from "@/components/events/PortalCreationWizard"

export default function NewPortalPage() {
  const router = useRouter()
  const { createPortal } = useEventPortal()

  return (
    <PortalCreationWizard
      onComplete={async (data) => {
        const portal = await createPortal({
          title: data.title,
          event_type: data.event_type,
          event_date: data.event_date,
          location_name: data.location_name,
          theme_config: data.theme_config,
        })
        if (portal) {
          router.push(`/us/events/${portal.id}`)
        }
      }}
      onCancel={() => router.push("/us/events")}
    />
  )
}
