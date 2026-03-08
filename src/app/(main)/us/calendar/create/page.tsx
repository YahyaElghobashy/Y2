"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { CreateEventForm } from "@/components/calendar/CreateEventForm"

function CreateEventContent() {
  const searchParams = useSearchParams()
  const defaultDate = searchParams.get("date") ?? undefined

  return <CreateEventForm defaultDate={defaultDate} />
}

export default function CreateEventPage() {
  return (
    <Suspense>
      <CreateEventContent />
    </Suspense>
  )
}
