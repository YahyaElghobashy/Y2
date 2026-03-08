"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Lock, ArrowRight, AlertCircle } from "lucide-react"
import { verifyPortalPassword } from "@/lib/actions/portal-auth"

type PasswordGateProps = {
  portalId: string
  portalTitle: string
}

export function PasswordGate({ portalId, portalTitle }: PasswordGateProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setError("")
    startTransition(async () => {
      const result = await verifyPortalPassword(portalId, password)
      if (result.success) {
        router.refresh()
      } else {
        setError("Incorrect password")
        setPassword("")
      }
    })
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-5"
      style={{ backgroundColor: "var(--portal-bg)", color: "var(--portal-text)" }}
      data-testid="password-gate"
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{
          backgroundColor: "var(--portal-surface)",
          borderRadius: "var(--portal-radius)",
        }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--portal-bg)" }}
        >
          <Lock className="h-5 w-5" style={{ color: "var(--portal-primary)" }} />
        </div>

        <h1
          className="mb-1 text-lg font-semibold"
          style={{ fontFamily: "var(--portal-font-heading)" }}
        >
          {portalTitle}
        </h1>
        <p className="mb-6 text-sm" style={{ color: "var(--portal-text-muted)" }}>
          This portal is password protected
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              borderColor: error ? "#ef4444" : "var(--portal-border)",
              backgroundColor: "var(--portal-bg)",
              color: "var(--portal-text)",
              borderRadius: "var(--portal-radius)",
            }}
            disabled={isPending}
            autoFocus
            data-testid="password-input"
          />

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              <span data-testid="password-error">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !password.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "var(--portal-primary)",
              borderRadius: "var(--portal-radius)",
            }}
            data-testid="password-submit"
          >
            {isPending ? "Verifying..." : "Enter"}
            {!isPending && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
