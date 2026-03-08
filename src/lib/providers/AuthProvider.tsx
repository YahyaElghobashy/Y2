"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile, AuthContextType } from "@/lib/types/user.types"

const ROUTES = { LOGIN: "/login" } as const

const AuthContext = createContext<AuthContextType | null>(null)

type AuthProviderProps = {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [partner, setPartner] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error || !data) return null
      return data as Profile
    },
    [supabase]
  )

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        // Handle password recovery flow — redirect to reset page if needed
        if (_event === "PASSWORD_RECOVERY") {
          if (typeof window !== "undefined" && !window.location.pathname.includes("/reset-password")) {
            router.push("/reset-password")
          }
          return
        }

        if (session?.user) {
          setUser(session.user)

          const userProfile = await fetchProfile(session.user.id)
          if (!mounted) return
          setProfile(userProfile)

          if (userProfile?.partner_id) {
            const partnerProfile = await fetchProfile(userProfile.partner_id)
            if (!mounted) return
            setPartner(partnerProfile)
          } else {
            setPartner(null)
          }
        } else {
          setUser(null)
          setProfile(null)
          setPartner(null)
        }

        if (mounted) setIsLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const profileNeedsSetup = !!(user && (!profile?.display_name || profile.display_name === "User"))

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const userProfile = await fetchProfile(user.id)
    setProfile(userProfile)
    if (userProfile?.partner_id) {
      const partnerProfile = await fetchProfile(userProfile.partner_id)
      setPartner(partnerProfile)
    }
  }, [user, fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push(ROUTES.LOGIN)
  }, [supabase, router])

  return (
    <AuthContext.Provider value={{ user, profile, partner, isLoading, profileNeedsSetup, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
