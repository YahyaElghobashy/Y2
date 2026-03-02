import type { Database } from "@/lib/types/database.types"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export type AuthContextType = {
  user: import("@supabase/supabase-js").User | null
  profile: Profile | null
  partner: Profile | null
  isLoading: boolean
  profileNeedsSetup: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}
