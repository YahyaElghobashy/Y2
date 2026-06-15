import { HomeView, HOME_MOCK } from "@/components/home/HomeView"
import { BottomNav } from "@/components/shared/BottomNav"

/**
 * Public design-preview harness (dev self-QA). Renders the real, props-driven
 * redesign components with mock data at mobile width — so the design can be
 * visually verified without authentication. Not linked anywhere in the app.
 */
export const metadata = { title: "Hayah — Preview" }

export default function PreviewPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <HomeView data={HOME_MOCK} />
      <BottomNav />
    </div>
  )
}
