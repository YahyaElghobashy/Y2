"use client"

import { useState } from "react"
import { User, Bell, Palette, Smartphone, Heart } from "lucide-react"
import { AnimatePresence } from "framer-motion"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { SettingsRow } from "@/components/shared/SettingsRow"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { ProfileEditForm } from "@/components/shared/ProfileEditForm"
import { useAuth } from "@/lib/providers/AuthProvider"
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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-6 pt-6 pb-2 text-xs uppercase tracking-wider text-text-muted font-body font-medium">
      {children}
    </h2>
  )
}

export default function SettingsPage() {
  const { profile, signOut, refreshProfile } = useAuth()
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  if (!profile) {
    return (
      <PageTransition>
        <PageHeader title="Settings" backHref="/" />
        <div className="px-6 mt-4">
          <LoadingSkeleton variant="card" />
        </div>
      </PageTransition>
    )
  }

  const initials = profile.display_name?.charAt(0).toUpperCase() ?? "?"

  return (
    <PageTransition>
      <PageHeader title="Settings" backHref="/" />

      {/* Profile Card */}
      <div className="mx-6 mt-4 p-4 bg-bg-elevated rounded-xl border border-border-subtle shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-accent-primary font-bold text-lg font-body">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-semibold text-text-primary font-body">{profile.display_name}</p>
            <p className="text-[13px] text-text-secondary font-body">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <SectionHeader>Account</SectionHeader>
      <div>
        <SettingsRow
          icon={<User size={20} strokeWidth={1.75} />}
          label="Profile"
          onClick={() => setIsEditingProfile(!isEditingProfile)}
        />
        <AnimatePresence>
          {isEditingProfile && (
            <ProfileEditForm
              profile={profile}
              onSave={async () => {
                setIsEditingProfile(false)
                await refreshProfile()
              }}
              onCancel={() => setIsEditingProfile(false)}
            />
          )}
        </AnimatePresence>
        <SettingsRow
          icon={<Bell size={20} strokeWidth={1.75} />}
          label="Notifications"
          href="/settings"
        />
      </div>

      {/* Appearance Section */}
      <SectionHeader>Appearance</SectionHeader>
      <div>
        <SettingsRow
          icon={<Palette size={20} strokeWidth={1.75} />}
          label="Theme"
          rightElement="Light"
        />
      </div>

      {/* About Section */}
      <SectionHeader>About</SectionHeader>
      <div>
        <SettingsRow
          icon={<Smartphone size={20} strokeWidth={1.75} />}
          label="App Version"
          rightElement="1.0.0"
        />
        <SettingsRow
          icon={<Heart size={20} strokeWidth={1.75} />}
          label="Made with love"
          rightElement="for Yara"
        />
      </div>

      {/* Log Out Button */}
      <div className="px-6 mt-8 mb-8">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="w-full py-3 text-[15px] font-medium text-red-500 border border-red-200 rounded-lg bg-transparent active:bg-red-50 transition-colors"
            >
              Log Out
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[20px] bg-bg-elevated">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Log out?</AlertDialogTitle>
              <AlertDialogDescription className="font-body text-text-secondary">
                You&#39;ll need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl font-body">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={signOut}
                className="rounded-xl bg-red-500 text-white hover:bg-red-600 font-body"
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
