// Auto-generated placeholder — will be overwritten by:
// supabase gen types typescript --project-id <id> > src/lib/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          email: string
          avatar_url: string | null
          partner_id: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          email: string
          avatar_url?: string | null
          partner_id?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          email?: string
          avatar_url?: string | null
          partner_id?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
