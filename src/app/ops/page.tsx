import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { CheckSquare } from "lucide-react"

export default function OpsPage() {
  return (
    <PageTransition>
      <PageHeader title="Ops" backHref="/" />
      <div className="px-6 py-8">
        <EmptyState
          icon={<CheckSquare size={48} />}
          title="Life, organized"
          subtitle="Shared grocery lists, tasks, wishlists, and budgets — together"
        />
      </div>
    </PageTransition>
  )
}
