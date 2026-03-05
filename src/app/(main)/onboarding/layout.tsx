export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-[var(--color-bg-primary)]">
      {children}
    </div>
  )
}
