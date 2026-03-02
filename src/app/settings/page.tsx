"use client"

import { User, Bell, Palette, Smartphone, Heart, LogOut } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { SettingsRow } from "@/components/shared/SettingsRow"

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-6 pt-6 pb-2 text-xs uppercase tracking-wider text-text-muted font-body font-medium">
      {children}
    </h2>
  )
}

export default function SettingsPage() {
  return (
    <PageTransition>
      <PageHeader title="Settings" backHref="/" />

      {/* Profile Card */}
      <div className="mx-6 mt-4 p-4 bg-bg-elevated rounded-xl border border-border-subtle shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
            <span className="text-accent-primary font-bold text-lg font-body">Y</span>
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-semibold text-text-primary font-body">Yahya</p>
            <p className="text-[13px] text-text-secondary font-body">yahya@email.com</p>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <SectionHeader>Account</SectionHeader>
      <div>
        <SettingsRow
          icon={<User size={20} strokeWidth={1.75} />}
          label="Profile"
          href="/settings"
        />
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
        <button
          type="button"
          onClick={() => console.log("logout")}
          className="w-full py-3 text-[15px] font-medium text-red-500 border border-red-200 rounded-lg bg-transparent active:bg-red-50 transition-colors"
        >
          Log Out
        </button>
      </div>
    </PageTransition>
  )
}
