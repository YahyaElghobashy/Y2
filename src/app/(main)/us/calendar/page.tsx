import { Calendar } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export default function CalendarTabPage() {
  return (
    <EmptyState
      icon={<Calendar size={48} strokeWidth={1.25} />}
      title="Shared Calendar"
      subtitle="Plan your days together — coming soon"
    />
  )
}
