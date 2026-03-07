"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getGoogleAuthUrl, disconnectGoogleCalendar } from "@/lib/google-calendar"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Calendar, Unlink } from "lucide-react"

type GoogleCalendarConnectProps = {
  className?: string
}

export function GoogleCalendarConnect({ className }: GoogleCalendarConnectProps) {
  const { user, profile, refreshProfile } = useAuth()
  const supabase = getSupabaseBrowserClient()
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const isConnected = Boolean(
    profile && "google_calendar_connected_at" in profile && profile.google_calendar_connected_at
  )

  const handleConnect = () => {
    window.location.href = getGoogleAuthUrl()
  }

  const handleDisconnect = async () => {
    if (!user) return
    setIsDisconnecting(true)
    await disconnectGoogleCalendar(supabase, user.id)
    await refreshProfile()
    setIsDisconnecting(false)
  }

  if (!user || !profile) return null

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3",
        className
      )}
      data-testid="google-calendar-connect"
    >
      <div className="flex items-center gap-3">
        <Calendar size={20} strokeWidth={1.5} className="text-[var(--color-text-secondary)]" />
        <div>
          <p className="text-[15px] font-body text-[var(--color-text-primary)]">
            Google Calendar
          </p>
          <p className="text-[12px] font-body text-[var(--color-text-muted)]">
            {isConnected ? "Connected" : "Sync events to Google"}
          </p>
        </div>
      </div>

      {isConnected ? (
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-red-600 bg-red-50 transition-colors active:bg-red-100 disabled:opacity-50"
          data-testid="gcal-disconnect-btn"
        >
          <Unlink size={14} />
          {isDisconnecting ? "..." : "Disconnect"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-[var(--color-accent-primary)] bg-[var(--color-accent-soft)] transition-colors active:opacity-80"
          data-testid="gcal-connect-btn"
        >
          Connect
        </button>
      )}
    </div>
  )
}
