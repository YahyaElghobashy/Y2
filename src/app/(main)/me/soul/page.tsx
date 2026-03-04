import { Sun } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"

export default function SoulPage() {
  return (
    <PageTransition>
      <PageHeader title="Soul" backHref="/me" />
      <div className="px-6 py-8">
        <EmptyState
          icon={<Sun size={48} strokeWidth={1.25} />}
          title="Your spiritual practice"
          subtitle="Prayer times, Quran progress, and morning azkar"
        />
      </div>
    </PageTransition>
  )
}
