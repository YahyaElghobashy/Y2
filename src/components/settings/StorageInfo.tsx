"use client"

import { useState, useEffect } from "react"
import { Database } from "lucide-react"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`
}

export function StorageInfo() {
  const [usage, setUsage] = useState<number | null>(null)
  const [quota, setQuota] = useState<number | null>(null)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    async function estimate() {
      if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
        setSupported(false)
        return
      }

      try {
        const est = await navigator.storage.estimate()
        setUsage(est.usage ?? null)
        setQuota(est.quota ?? null)
      } catch {
        setSupported(false)
      }
    }

    estimate()
  }, [])

  if (!supported) {
    return (
      <div className="flex items-center px-4 py-3.5 border-b border-[var(--color-border-subtle)]">
        <Database size={20} strokeWidth={1.5} className="text-[var(--color-text-secondary)] shrink-0" />
        <div className="flex-1 min-w-0 ms-3">
          <span className="text-[15px] font-body text-[var(--color-text-primary)]">
            Storage
          </span>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Storage info unavailable
          </p>
        </div>
      </div>
    )
  }

  const percent = usage != null && quota != null && quota > 0
    ? Math.min((usage / quota) * 100, 100)
    : 0

  return (
    <div className="flex items-center px-4 py-3.5 border-b border-[var(--color-border-subtle)]">
      <Database size={20} strokeWidth={1.5} className="text-[var(--color-text-secondary)] shrink-0" />
      <div className="flex-1 min-w-0 ms-3">
        <span className="text-[15px] font-body text-[var(--color-text-primary)]">
          Storage
        </span>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-accent-primary)] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-[var(--color-text-muted)] shrink-0">
            {usage != null ? formatBytes(usage) : "..."}{" "}
            {quota != null ? `/ ${formatBytes(quota)}` : ""}
          </span>
        </div>
      </div>
    </div>
  )
}
