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
      coyyns_wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          lifetime_earned: number
          lifetime_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coyyns_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      coyyns_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          category: string
          description: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: string
          category: string
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: string
          category?: string
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coyyns_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          title: string
          body: string
          emoji: string | null
          status: string
          type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          title: string
          body: string
          emoji?: string | null
          status?: string
          type?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          title?: string
          body?: string
          emoji?: string | null
          status?: string
          type?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_send_limits: {
        Row: {
          id: string
          user_id: string
          date: string
          free_sends_used: number
          bonus_sends_used: number
          bonus_sends_available: number
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          free_sends_used?: number
          bonus_sends_used?: number
          bonus_sends_available?: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          free_sends_used?: number
          bonus_sends_used?: number
          bonus_sends_available?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_send_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription: Json
          device_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription: Json
          device_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription?: Json
          device_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      cycle_config: {
        Row: {
          id: string
          owner_id: string
          pill_start_date: string
          active_days: number
          break_days: number
          pms_warning_days: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          pill_start_date: string
          active_days?: number
          break_days?: number
          pms_warning_days?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          pill_start_date?: string
          active_days?: number
          break_days?: number
          pms_warning_days?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycle_config_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      cycle_logs: {
        Row: {
          id: string
          owner_id: string
          date: string
          mood: string | null
          symptoms: string[]
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          date: string
          mood?: string | null
          symptoms?: string[]
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          date?: string
          mood?: string | null
          symptoms?: string[]
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycle_logs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      coupons: {
        Row: {
          id: string
          creator_id: string
          recipient_id: string
          title: string
          description: string | null
          emoji: string | null
          category: string
          image_url: string | null
          status: string
          is_surprise: boolean
          surprise_revealed: boolean
          redeemed_at: string | null
          approved_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          recipient_id: string
          title: string
          description?: string | null
          emoji?: string | null
          category?: string
          image_url?: string | null
          status?: string
          is_surprise?: boolean
          surprise_revealed?: boolean
          redeemed_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          recipient_id?: string
          title?: string
          description?: string | null
          emoji?: string | null
          category?: string
          image_url?: string | null
          status?: string
          is_surprise?: boolean
          surprise_revealed?: boolean
          redeemed_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      coupon_history: {
        Row: {
          id: string
          coupon_id: string
          action: string
          actor_id: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          coupon_id: string
          action: string
          actor_id: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          coupon_id?: string
          action?: string
          actor_id?: string
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_history_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      challenges: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          emoji: string | null
          stakes: number
          deadline: string | null
          status: string
          claimed_by: string | null
          winner_id: string | null
          actual_transfer: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          emoji?: string | null
          stakes?: number
          deadline?: string | null
          status?: string
          claimed_by?: string | null
          winner_id?: string | null
          actual_transfer?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          emoji?: string | null
          stakes?: number
          deadline?: string | null
          status?: string
          claimed_by?: string | null
          winner_id?: string | null
          actual_transfer?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      marketplace_items: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          icon: string
          effect_type: string
          effect_config: Json
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          icon: string
          effect_type: string
          effect_config?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          icon?: string
          effect_type?: string
          effect_config?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          id: string
          buyer_id: string
          target_id: string
          item_id: string
          cost: number
          effect_payload: Json | null
          status: string
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          buyer_id: string
          target_id: string
          item_id: string
          cost: number
          effect_payload?: Json | null
          status?: string
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          buyer_id?: string
          target_id?: string
          item_id?: string
          cost?: number
          effect_payload?: Json | null
          status?: string
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          }
        ]
      }
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
        Relationships: [
          {
            foreignKeyName: "profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
