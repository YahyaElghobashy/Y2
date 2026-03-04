import { Sparkles } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"

export default function VisionBoardPage() {
  return (
    <PageTransition>
      <PageHeader title="2026" />
      <div className="px-6 py-8">
        <EmptyState
          icon={<Sparkles size={48} strokeWidth={1.25} />}
          title="Vision Board"
          subtitle="Your 2026 vision board is coming soon"
        />
      </div>
    </PageTransition>
  )
}
