import { TreasuryView, TREASURY_MOCK } from "@/components/treasury/TreasuryView"
import { BottomNav } from "@/components/shared/BottomNav"

export const metadata = { title: "Hayah — Treasury Preview" }

export default function PreviewTreasuryPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <TreasuryView data={TREASURY_MOCK} />
      <BottomNav />
    </div>
  )
}
