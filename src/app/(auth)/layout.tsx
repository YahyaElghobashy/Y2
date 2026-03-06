import { SectionBackground } from "@/components/animations/SectionBackground"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-[100dvh]" style={{ backgroundColor: "var(--bg-primary, #FAF7F4)" }}>
      <SectionBackground />
      {/* Soft vignette overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(44,40,37,0.04) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
