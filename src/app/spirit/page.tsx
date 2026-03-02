import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Sun } from "lucide-react"

export default function SpiritPage() {
  return (
    <PageTransition>
      <PageHeader title="Spirit" backHref="/" />
      <div className="px-6 py-8">
        <EmptyState
          icon={<Sun size={48} />}
          title="Your daily practice"
          subtitle="Prayer times, Quran progress, and morning azkar — a quiet space for what matters"
        />
      </div>
    </PageTransition>
  )
}
