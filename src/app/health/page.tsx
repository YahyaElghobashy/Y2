import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Activity } from "lucide-react"

export default function HealthPage() {
  return (
    <PageTransition>
      <PageHeader title="Health" backHref="/" />
      <div className="px-6 py-8">
        <EmptyState
          icon={<Activity size={48} />}
          title="Your wellness, tracked"
          subtitle="Fitness goals, health reminders, and wellness insights — all in one place"
        />
      </div>
    </PageTransition>
  )
}
