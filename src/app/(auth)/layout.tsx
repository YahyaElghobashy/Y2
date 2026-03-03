import { HayahGradient } from "@/components/animations/HayahGradient"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-[100dvh] bg-bg-primary">
      <HayahGradient />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
