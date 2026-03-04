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
} from "lucide-react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { SettingsRow } from "@/components/shared/SettingsRow"
import { ProfileEditForm } from "@/components/shared/ProfileEditForm"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
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
  const { user, profile, partner, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const [editingProfile, setEditingProfile] = useState(false)
  const [unpairOpen, setUnpairOpen] = useState(false)
  const [unpairing, setUnpairing] = useState(false)

  if (!profile) {
    return (
      <PageTransition>
        <PageHeader title="More" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  const initials = (profile.display_name || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <PageTransition>
      <PageHeader title="More" />

      <div className="flex flex-col gap-6 px-5 py-5">
        {/* Profile Card */}
        <div className="flex items-center gap-4 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] p-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || "Avatar"}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-soft)] font-[family-name:var(--font-display)] text-[18px] font-semibold text-[var(--color-accent-primary)]">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <p className="font-[family-name:var(--font-display)] text-[17px] font-semibold text-[var(--color-text-primary)]">
              {profile.display_name || "User"}
            </p>
            <p className="font-[family-name:var(--font-body)] text-[13px] text-[var(--color-text-secondary)]">
              {profile.email || user?.email || ""}
            </p>
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
          <p className="mb-2 font-[family-name:var(--font-body)] text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
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
          <p className="mb-2 font-[family-name:var(--font-body)] text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Preferences
          </p>
          <div className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] overflow-hidden">
            <SettingsRow
              icon={<Bell size={20} strokeWidth={1.5} />}
              label="Notifications"
              subtitle="Push notification settings"
            />
            <SettingsRow
              icon={<Palette size={20} strokeWidth={1.5} />}
              label="Theme"
              rightElement={
                <span className="font-[family-name:var(--font-body)] text-[13px] text-[var(--color-text-muted)]">
                  Light
                </span>
              }
            />
          </div>
        </div>

        {/* About Section */}
        <div>
          <p className="mb-2 font-[family-name:var(--font-body)] text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
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
                <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-text-muted)]">
                  1.0.0
                </span>
              }
            />
            <SettingsRow
              icon={<Heart size={20} strokeWidth={1.5} />}
              label="Made with love for Yara"
              subtitle="Always and forever"
            />
          </div>
        </div>

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
