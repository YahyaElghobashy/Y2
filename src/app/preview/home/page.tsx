import { HomeView, HOME_MOCK } from "@/components/home/HomeView"
import { BottomNav } from "@/components/shared/BottomNav"

export const metadata = { title: "Hayah — Home Preview" }

export default function PreviewHomePage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <HomeView data={HOME_MOCK} />
      <BottomNav />
    </div>
  )
}
