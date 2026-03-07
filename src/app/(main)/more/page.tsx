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
  const [unpairOpen, setUnpairOpen] = useState(false)
  const [unpairing, setUnpairing] = useState(false)
  const [clearCacheOpen, setClearCacheOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="More" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  if (!profile) {
    return (
      <PageTransition>
        <PageHeader title="More" />
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
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-[15px] font-medium text-red-600 transition-colors active:bg-red-100"
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
                  className="bg-red-600 text-white hover:bg-red-700"
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
      <PageHeader title="More" />

      <div className="flex flex-col gap-6 px-5 py-5">
        {/* Profile Card */}
        <div className="flex items-center gap-4 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] p-4">
          <Avatar
            src={profile.avatar_url}
            name={profile.display_name}
            size="lg"
          />
          <div className="flex-1">
            <p className="font-display text-[17px] font-semibold text-[var(--color-text-primary)]">
              {profile.display_name || "User"}
            </p>
            <p className="font-body text-[13px] text-[var(--color-text-secondary)]">
              {profile.email || user?.email || ""}
            </p>
            {partner && (
              <p className="mt-1 flex items-center gap-1 text-[12px] text-[var(--accent-copper,#B87333)]">
                <Heart size={12} strokeWidth={1.75} className="fill-current" />
                <span className="font-medium">Paired with {partner.display_name}</span>
              </p>
            )}
            {profile.role && (
              <span className="inline-block mt-1 font-mono text-[10px] text-[var(--color-accent-primary)] bg-[var(--color-accent-soft)] px-2 py-0.5 rounded-md uppercase tracking-wide">
                {profile.role}
              </span>
            )}
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
          </div>
        </div>

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
              label="Theme"
              rightElement={
                <span className="font-body text-[13px] text-[var(--color-text-muted)]">
                  Light
                </span>
              }
            />
            <SettingsRow
              icon={<Globe size={20} strokeWidth={1.5} />}
              label="Language"
              subtitle="English"
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
            <div className="px-4 py-3 text-center">
              <Heart size={16} strokeWidth={1.75} className="mx-auto mb-1 text-[var(--accent-copper,#B87333)]" />
              <p className="font-serif italic text-[13px] text-[var(--color-text-secondary)]">
                Made with love for Yara
              </p>
              <p className="font-mono text-[11px] text-[var(--color-text-muted)] mt-0.5">
                v{process.env.APP_VERSION ?? "0.1.0"}
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
                className="bg-red-600 text-white hover:bg-red-700"
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
                className="bg-red-600 text-white hover:bg-red-700"
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
                className="bg-red-600 text-white hover:bg-red-700"
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
