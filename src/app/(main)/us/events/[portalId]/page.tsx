"use client"

import { useParams, useRouter } from "next/navigation"
import { PortalDashboard } from "@/components/events/admin/PortalDashboard"

export default function PortalAdminPage() {
  const params = useParams()
  const router = useRouter()
  const portalId = params.portalId as string

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <PortalDashboard
        portalId={portalId}
        onEdit={() => router.push(`/us/events/${portalId}/edit`)}
      />
    </div>
  )
}
