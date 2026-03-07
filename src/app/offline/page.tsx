import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--color-bg-primary)] px-5">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-bg-secondary)]">
          <WifiOff size={36} className="text-[var(--color-text-muted)]" />
        </div>
        <h1 className="font-display text-[24px] font-bold text-[var(--color-text-primary)]">
          You&apos;re offline
        </h1>
        <p className="max-w-xs font-body text-[14px] text-[var(--color-text-secondary)]">
          Hayah will be back when you reconnect
        </p>
      </div>
    </main>
  )
}
