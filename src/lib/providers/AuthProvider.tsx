"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"
import type { Profile, AuthContextType } from "@/lib/types/user.types"

const ROUTES = { LOGIN: "/login" } as const

const AuthContext = createContext<AuthContextType | null>(null)

type AuthProviderProps = {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  // Stable singleton — getSupabaseBrowserClient() memoizes, so this reference is
  // identical across every render and never re-triggers the auth effect.
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

  // Hydrate profile + partner for the current user. Deliberately invoked OUTSIDE
  // the onAuthStateChange callback (see effect below) — calling supabase data
  // methods inside that callback can deadlock on the auth lock and is what left
  // isLoading stuck true (perpetual spinner until hard refresh).
  const hydrateProfile = useCallback(
    async (u: User | null) => {
      if (!u) {
        setProfile(null)
        setPartner(null)
        return
      }
      const userProfile = await fetchProfile(u.id)
      setProfile(userProfile)
      if (userProfile?.partner_id) {
        setPartner(await fetchProfile(userProfile.partner_id))
      } else {
        setPartner(null)
      }
    },
    [fetchProfile]
  )

  useEffect(() => {
    let mounted = true
    // isLoading must flip to false exactly once. Guarding with a local flag (not
    // the isLoading state) means a later auth event — soft-nav, token refresh —
    // can never re-raise the initial spinner.
    let loadingCleared = false
    // Track the resolved user id so duplicate events for the same user
    // (TOKEN_REFRESHED, repeated INITIAL_SESSION) don't churn `user`/effects
    // downstream.
    let currentUserId: string | null = null
    // Once a live auth event has applied, the one-shot getSession() result is
    // stale and must not clobber it (e.g. seed-vs-event ordering races).
    let sawAuthEvent = false

    const clearLoadingOnce = () => {
      if (loadingCleared) return
      loadingCleared = true
      setIsLoading(false)
    }

    const applySession = (session: Session | null) => {
      if (!mounted) return
      const nextUser = session?.user ?? null
      const nextId = nextUser?.id ?? null

      if (nextId !== currentUserId) {
        currentUserId = nextId
        setUser(nextUser)
        // Defer to a microtask so the (supabase-calling) profile fetch runs
        // after the auth lock is released — never blocks, never deadlocks.
        queueMicrotask(() => {
          if (mounted) void hydrateProfile(nextUser)
        })
      }

      clearLoadingOnce()
    }

    // 1. Seed from the persisted session on mount. This clears the spinner
    //    immediately on its own, independent of the async auth event stream, so
    //    the shell can never hang waiting for an event that is slow or contends
    //    on the auth lock. Skip seeding if a live event already arrived first.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return
        if (!sawAuthEvent) applySession(session)
        clearLoadingOnce()
      })
      .catch(() => clearLoadingOnce())

    // 2. Keep this callback SYNCHRONOUS (no async/await). It only records the
    //    session; the profile fetch is deferred above. This is the documented
    //    way to avoid the supabase-js auth-lock deadlock.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      sawAuthEvent = true
      applySession(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, hydrateProfile])

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
