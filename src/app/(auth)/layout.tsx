import { SectionBackground } from "@/components/animations/SectionBackground"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-[100dvh]" style={{ backgroundColor: "var(--bg-primary, #FAF7F4)" }}>
      <SectionBackground />
      {/* Warm copper glow + soft vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(184,115,51,0.04) 0%, transparent 70%), radial-gradient(ellipse at center, transparent 50%, rgba(44,40,37,0.04) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
