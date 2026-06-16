"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  UserCircle,
  Heart,
  Bell,
  Palette,
  Info,
  LogOut,
  Link2Off,
  Calendar,
  Trash2,
  Download,
  Globe,
  KeyRound,
} from "lucide-react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { SettingsRow } from "@/components/shared/SettingsRow"
import { ProfileEditForm } from "@/components/shared/ProfileEditForm"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { Avatar } from "@/components/shared/Avatar"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect"
import { GoogleDriveConnect } from "@/components/settings/GoogleDriveConnect"
import { StorageInfo } from "@/components/settings/StorageInfo"
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function MorePage() {
  const { user, profile, partner, isLoading, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const [editingProfile, setEditingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [unpairOpen, setUnpairOpen] = useState(false)
  const [unpairing, setUnpairing] = useState(false)
  const [clearCacheOpen, setClearCacheOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Settings" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  if (!profile) {
    return (
      <PageTransition>
        <PageHeader title="Settings" />
        <div className="flex flex-col gap-6 px-5 py-6">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] p-6 text-center">
            <UserCircle size={48} strokeWidth={1.25} className="text-[var(--color-text-muted)]" />
            <p className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
              Could not load profile
            </p>
            <p className="font-body text-[13px] text-[var(--color-text-secondary)]">
              {user?.email ?? "Please try again"}
            </p>
            <button
              type="button"
              onClick={() => refreshProfile()}
              className="mt-2 rounded-xl bg-[var(--color-accent-soft)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-accent-primary)] transition-colors active:opacity-80"
            >
              Retry
            </button>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--destructive)]/25 bg-[color:var(--destructive)]/10 text-[15px] font-medium text-[var(--destructive)] transition-colors active:bg-[color:var(--destructive)]/15"
              >
                <LogOut size={18} strokeWidth={1.5} />
                Log Out
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You&apos;ll need to sign in again to access your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => signOut()}
                  className="bg-[var(--destructive)] text-white hover:opacity-90"
                >
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageHeader title="Settings" />

      <div className="skin-aware flex flex-col gap-6 px-5 py-5">
        {/* Profile poster — warm paper, golden-hour wash, wordmark whisper */}
        <div className="texture-parchment relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] p-5 shadow-warm-md" style={{ background: "linear-gradient(155deg, var(--color-bg-elevated, #FFFDF9) 0%, var(--color-sand, #EBDDC7) 140%)" }}>
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(120% 80% at 100% -10%, rgba(242,169,59,0.16) 0%, transparent 60%)" }}
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-4">
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name}
              size="lg"
            />
            <div className="flex-1">
              <p className="text-[19px] font-bold tracking-tight text-[var(--color-ink,#2A2018)]" style={{ fontFamily: "var(--font-display)" }}>
                {profile.display_name || "User"}
              </p>
              <p className="text-[13px] text-[var(--color-ink-soft,#6B5D4F)]" style={{ fontFamily: "var(--font-body)" }}>
                {profile.email || user?.email || ""}
              </p>
              {partner && (
                <p className="mt-1.5 flex items-center gap-1 text-[13px]" style={{ color: "var(--color-terracotta, #C8552B)", fontFamily: "var(--font-handwritten)" }}>
                  <Heart size={13} strokeWidth={1.75} className="fill-current" />
                  <span>paired with {partner.display_name}</span>
                </p>
              )}
              {profile.role && (
                <span className="mt-1.5 inline-block rounded-md bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-accent-copper-dark,#8B5E2B)]" style={{ fontFamily: "var(--font-mono)" }}>
                  {profile.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Inline Profile Edit */}
        {editingProfile && (
          <ProfileEditForm
            profile={{
              id: profile.id,
              display_name: profile.display_name || "",
              email: profile.email || user?.email || "",
              avatar_url: profile.avatar_url || null,
            }}
            onSave={() => setEditingProfile(false)}
            onCancel={() => setEditingProfile(false)}
          />
        )}

        {/* Account Section */}
        <div>
          <p className="mb-2 font-nav text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Account
          </p>
          <div className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] overflow-hidden">
            <SettingsRow
              icon={<UserCircle size={20} strokeWidth={1.5} />}
              label="Profile"
              subtitle="Edit your name and avatar"
              onClick={() => setEditingProfile(!editingProfile)}
            />
            <SettingsRow
              icon={<Heart size={20} strokeWidth={1.5} />}
              label="Partner"
              subtitle={partner?.display_name || "Not connected"}
              onClick={partner ? () => setUnpairOpen(true) : () => router.push("/pair")}
            />
            <SettingsRow
              icon={<KeyRound size={20} strokeWidth={1.5} />}
              label="Change Password"
              subtitle="Update your account password"
              onClick={() => setChangingPassword(!changingPassword)}
            />
          </div>
        </div>

        {/* Inline Change Password */}
        {changingPassword && (
          <ChangePasswordForm onClose={() => setChangingPassword(false)} />
        )}

        {/* Preferences Section */}
        <div>
          <p className="mb-2 font-nav text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Preferences
          </p>
          <div className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] overflow-hidden">
            <SettingsRow
              icon={<Bell size={20} strokeWidth={1.5} />}
              label="Notifications"
              subtitle="Push notification settings"
              href="/more/notifications"
            />
            <GoogleCalendarConnect />
            <GoogleDriveConnect />
            <SettingsRow
              icon={<Palette size={20} strokeWidth={1.5} />}
              label="Skin"
              subtitle="Shifts with the Cairo day"
              rightElement={
                <span className="font-body text-[13px] text-[var(--color-text-muted)]">
                  Adaptive ☀️/🌙
                </span>
              }
            />
            <SettingsRow
              icon={<Globe size={20} strokeWidth={1.5} />}
              label="Language"
              subtitle="English · العربية"
              rightElement={
                <span className="font-body text-[13px] text-[var(--color-text-muted)]">
                  Coming soon
                </span>
              }
            />
          </div>
        </div>

        {/* Data & Storage Section */}
        <div>
          <p className="mb-2 font-nav text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Data &amp; Storage
          </p>
          <div className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] overflow-hidden">
            <StorageInfo />
            <SettingsRow
              icon={<Trash2 size={20} strokeWidth={1.5} />}
              label="Clear Cache"
              subtitle="Remove cached data and reload"
              onClick={() => setClearCacheOpen(true)}
            />
            <SettingsRow
              icon={<Download size={20} strokeWidth={1.5} />}
              label="Export My Data"
              rightElement={
                <span className="font-body text-[13px] text-[var(--color-text-muted)]">
                  Coming soon
                </span>
              }
            />
          </div>
        </div>

        {/* About Section */}
        <div>
          <p className="mb-2 font-nav text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
            About
          </p>
          <div className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] overflow-hidden">
            <SettingsRow
              icon={<Info size={20} strokeWidth={1.5} />}
              label="About Hayah"
              href="/more/about"
            />
            <SettingsRow
              icon={<Info size={20} strokeWidth={1.5} />}
              label="Version"
              rightElement={
                <span className="font-mono text-[13px] text-[var(--color-text-muted)]">
                  {process.env.APP_VERSION ?? "0.1.0"}
                </span>
              }
            />
            <div className="px-4 py-4 text-center">
              <Heart size={16} strokeWidth={1.75} className="mx-auto mb-1.5" style={{ color: "var(--color-terracotta, #C8552B)" }} />
              <p className="text-[16px]" style={{ fontFamily: "var(--font-handwritten)", color: "var(--color-terracotta, #C8552B)" }}>
                made with love, for Yara
              </p>
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
                Hayah · حياة · v{process.env.APP_VERSION ?? "0.1.0"}
              </p>
            </div>
          </div>
        </div>

        {/* Clear Cache Dialog */}
        <AlertDialog open={clearCacheOpen} onOpenChange={setClearCacheOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear cached data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all cached data and reload the app. Your account data will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isClearing}
                onClick={async (e) => {
                  e.preventDefault()
                  setIsClearing(true)
                  try {
                    const keys = await caches.keys()
                    await Promise.all(keys.map((key) => caches.delete(key)))
                    window.location.reload()
                  } catch {
                    setIsClearing(false)
                    setClearCacheOpen(false)
                  }
                }}
                className="bg-[var(--destructive)] text-white hover:opacity-90"
              >
                {isClearing ? "Clearing..." : "Clear Cache"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unpair Dialog */}
        <AlertDialog open={unpairOpen} onOpenChange={setUnpairOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unpair from {partner?.display_name || "partner"}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will disconnect you from your partner. You can re-pair later using a new invite code.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={unpairing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={unpairing}
                onClick={async (e) => {
                  e.preventDefault()
                  if (!user) return
                  setUnpairing(true)
                  try {
                    const supabase = getSupabaseBrowserClient()
                    await supabase.rpc("unpair_partners", { my_id: user.id })
                    await refreshProfile()
                    setUnpairOpen(false)
                  } catch {
                    // silent fail
                  } finally {
                    setUnpairing(false)
                  }
                }}
                className="bg-[var(--destructive)] text-white hover:opacity-90"
                data-testid="confirm-unpair-btn"
              >
                <Link2Off size={16} className="me-1.5" />
                {unpairing ? "Unpairing..." : "Unpair"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Logout */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-[15px] font-medium text-red-600 transition-colors active:bg-red-100"
              data-testid="logout-btn"
            >
              <LogOut size={18} strokeWidth={1.5} />
              Log Out
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Log out?</AlertDialogTitle>
              <AlertDialogDescription>
                You&apos;ll need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => signOut()}
                className="bg-[var(--destructive)] text-white hover:opacity-90"
              >
                Log Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  )
}
