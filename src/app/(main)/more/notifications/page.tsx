"use client"

import { useState } from "react"
import {
  Bell,
  BellOff,
  Smartphone,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react"
import { PageTransition, FadeIn, StaggerList } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { SettingsRow } from "@/components/shared/SettingsRow"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { PermissionBanner } from "@/components/settings/PermissionBanner"
import { Switch } from "@/components/ui/switch"
import { usePushSettings } from "@/lib/hooks/use-push-settings"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getDeviceLabel(subscription: Record<string, unknown>): string {
  const endpoint = (subscription?.endpoint as string) ?? ""
  if (endpoint.includes("fcm.googleapis.com")) return "Chrome / Android"
  if (endpoint.includes("mozilla.com")) return "Firefox"
  if (endpoint.includes("windows.com")) return "Windows"
  if (endpoint.includes("apple.com") || endpoint.includes("push.apple")) return "Safari / iOS"
  return "Web Browser"
}

export default function NotificationsPage() {
  const {
    permissionState,
    isSubscribed,
    isLoading,
    devices,
    currentEndpoint,
    error,
    togglePush,
    removeDevice,
  } = usePushSettings()

  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemoveDevice = async () => {
    if (!removeTargetId) return
    setIsRemoving(true)
    await removeDevice(removeTargetId)
    setIsRemoving(false)
    setRemoveTargetId(null)
  }

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Notifications" backHref="/more" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={2} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageHeader title="Notifications" backHref="/more" />

      <div className="flex flex-col gap-6 px-5 py-5">
        {/* Push Toggle */}
        <FadeIn>
          <div>
            <p className="mb-2 font-body text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Push Notifications
            </p>
            <div className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] overflow-hidden">
              <SettingsRow
                icon={
                  isSubscribed ? (
                    <Bell size={20} strokeWidth={1.5} />
                  ) : (
                    <BellOff size={20} strokeWidth={1.5} />
                  )
                }
                label="Push Notifications"
                subtitle={
                  isSubscribed
                    ? "You'll receive notifications from your partner"
                    : "Enable to receive notifications"
                }
                rightElement={
                  <Switch
                    checked={isSubscribed}
                    onCheckedChange={togglePush}
                    disabled={permissionState === "denied" || permissionState === "unsupported"}
                    data-testid="push-toggle"
                  />
                }
              />
            </div>
          </div>
        </FadeIn>

        {/* Permission Status */}
        <FadeIn delay={0.1}>
          {permissionState === "unsupported" && (
            <PermissionBanner
              variant="info"
              icon={<Info size={18} strokeWidth={1.5} />}
              title="Not Supported"
              description="Push notifications are not supported on this browser. Try using Chrome or Safari."
            />
          )}
          {permissionState === "denied" && (
            <PermissionBanner
              variant="warning"
              icon={<AlertTriangle size={18} strokeWidth={1.5} />}
              title="Notifications Blocked"
              description="Notifications are blocked in your browser settings. To enable them, go to your browser's site settings and allow notifications for this site."
            />
          )}
          {permissionState === "default" && !isSubscribed && (
            <PermissionBanner
              variant="info"
              icon={<Info size={18} strokeWidth={1.5} />}
              title="Not Enabled"
              description="Tap the toggle above to enable push notifications. Your browser will ask for permission."
            />
          )}
          {permissionState === "granted" && isSubscribed && (
            <PermissionBanner
              variant="success"
              icon={<CheckCircle2 size={18} strokeWidth={1.5} />}
              title="Notifications Active"
              description="You'll receive push notifications when your partner sends you a ping or interacts with shared features."
            />
          )}
        </FadeIn>

        {/* Error Display */}
        {error && (
          <FadeIn>
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="font-body text-[13px] text-red-700">
                {error}
              </p>
            </div>
          </FadeIn>
        )}

        {/* Registered Devices */}
        <FadeIn delay={0.2}>
          <div>
            <p className="mb-2 font-body text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Registered Devices
            </p>

            {devices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] p-8 text-center">
                <Smartphone
                  size={32}
                  strokeWidth={1.25}
                  className="text-[var(--color-text-muted)]"
                />
                <p className="font-body text-[14px] text-[var(--color-text-secondary)]">
                  No devices registered
                </p>
                <p className="font-body text-[12px] text-[var(--color-text-muted)]">
                  Enable push notifications to register this device
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] overflow-hidden">
                <StaggerList staggerDelay={0.06}>
                  {devices.map((device) => {
                    const sub = device.subscription as Record<string, unknown>
                    const isCurrentDevice = sub?.endpoint === currentEndpoint

                    return (
                      <div
                        key={device.id}
                        className="flex items-center px-4 py-3.5 border-b border-[var(--color-border-subtle)] last:border-b-0"
                      >
                        <Smartphone
                          size={18}
                          strokeWidth={1.5}
                          className="text-[var(--color-text-secondary)] shrink-0"
                        />
                        <div className="flex-1 min-w-0 ms-3">
                          <div className="flex items-center gap-2">
                            <span className="font-body text-[14px] text-[var(--color-text-primary)]">
                              {device.device_name || getDeviceLabel(sub)}
                            </span>
                            {isCurrentDevice && (
                              <span className="font-mono text-[10px] text-[var(--color-accent-primary)] bg-[var(--color-accent-soft)] px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                This device
                              </span>
                            )}
                          </div>
                          <p className="font-body text-[12px] text-[var(--color-text-muted)] mt-0.5">
                            Registered {formatDate(device.created_at)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRemoveTargetId(device.id)}
                          className="shrink-0 ms-2 rounded-lg p-2 text-red-500 transition-colors active:bg-red-50"
                          aria-label={`Remove ${device.device_name || "device"}`}
                          data-testid={`remove-device-${device.id}`}
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    )
                  })}
                </StaggerList>
              </div>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Remove Device Confirmation */}
      <AlertDialog
        open={Boolean(removeTargetId)}
        onOpenChange={(open) => !open && setRemoveTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove device?</AlertDialogTitle>
            <AlertDialogDescription>
              This device will no longer receive push notifications. You can re-register it later by enabling notifications again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRemoveDevice()
              }}
              disabled={isRemoving}
              className="bg-red-600 text-white hover:bg-red-700"
              data-testid="confirm-remove-device"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  )
}
