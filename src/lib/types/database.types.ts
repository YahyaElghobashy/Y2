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
          acceptor_id: string | null
          resolution_note: string | null
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
          acceptor_id?: string | null
          resolution_note?: string | null
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
          acceptor_id?: string | null
          resolution_note?: string | null
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
      bounties: {
        Row: {
          id: string
          creator_id: string
          title: string
          trigger_description: string
          reward: number
          is_recurring: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          trigger_description: string
          reward: number
          is_recurring?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          trigger_description?: string
          reward?: number
          is_recurring?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounties_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      bounty_claims: {
        Row: {
          id: string
          bounty_id: string
          claimer_id: string
          confirmed_by: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bounty_id: string
          claimer_id: string
          confirmed_by?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bounty_id?: string
          claimer_id?: string
          confirmed_by?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounty_claims_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bounty_claims_claimer_id_fkey"
            columns: ["claimer_id"]
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
          invite_code: string | null
          pairing_status: string
          paired_at: string | null
          google_calendar_refresh_token: string | null
          google_calendar_connected_at: string | null
          google_drive_refresh_token: string | null
          google_drive_connected_at: string | null
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
          invite_code?: string | null
          pairing_status?: string
          paired_at?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_connected_at?: string | null
          google_drive_refresh_token?: string | null
          google_drive_connected_at?: string | null
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
          invite_code?: string | null
          pairing_status?: string
          paired_at?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_connected_at?: string | null
          google_drive_refresh_token?: string | null
          google_drive_connected_at?: string | null
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
      events: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          event_date: string
          event_time: string | null
          end_time: string | null
          recurrence: string
          category: string
          color: string | null
          google_calendar_event_id: string | null
          is_shared: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          event_date: string
          event_time?: string | null
          end_time?: string | null
          recurrence?: string
          category?: string
          color?: string | null
          google_calendar_event_id?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          end_time?: string | null
          recurrence?: string
          category?: string
          color?: string | null
          google_calendar_event_id?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      prayer_log: {
        Row: {
          id: string
          user_id: string
          date: string
          fajr: boolean
          dhuhr: boolean
          asr: boolean
          maghrib: boolean
          isha: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          fajr?: boolean
          dhuhr?: boolean
          asr?: boolean
          maghrib?: boolean
          isha?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          fajr?: boolean
          dhuhr?: boolean
          asr?: boolean
          maghrib?: boolean
          isha?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      quran_log: {
        Row: {
          id: string
          user_id: string
          date: string
          pages_read: number
          daily_goal: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          pages_read?: number
          daily_goal?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          pages_read?: number
          daily_goal?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quran_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      azkar_sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          session_type: string
          count: number
          target: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          session_type: string
          count?: number
          target?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          session_type?: string
          count?: number
          target?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "azkar_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      shared_lists: {
        Row: {
          id: string
          created_by: string
          title: string
          list_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          title: string
          list_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          title?: string
          list_type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      list_items: {
        Row: {
          id: string
          list_id: string
          parent_id: string | null
          title: string
          is_completed: boolean
          completed_by: string | null
          completed_at: string | null
          coyyns_reward: number
          position: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          parent_id?: string | null
          title: string
          is_completed?: boolean
          completed_by?: string | null
          completed_at?: string | null
          coyyns_reward?: number
          position?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          parent_id?: string | null
          title?: string
          is_completed?: boolean
          completed_by?: string | null
          completed_at?: string | null
          coyyns_reward?: number
          position?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shared_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "list_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      rituals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          icon: string
          cadence: string
          is_shared: boolean
          coyyns_reward: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          icon?: string
          cadence: string
          is_shared?: boolean
          coyyns_reward?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          icon?: string
          cadence?: string
          is_shared?: boolean
          coyyns_reward?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rituals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ritual_logs: {
        Row: {
          id: string
          ritual_id: string
          user_id: string
          period_key: string
          note: string | null
          photo_url: string | null
          logged_at: string
          created_at: string
        }
        Insert: {
          id?: string
          ritual_id: string
          user_id: string
          period_key: string
          note?: string | null
          photo_url?: string | null
          logged_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          ritual_id?: string
          user_id?: string
          period_key?: string
          note?: string | null
          photo_url?: string | null
          logged_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_logs_ritual_id_fkey"
            columns: ["ritual_id"]
            isOneToOne: false
            referencedRelation: "rituals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ritual_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ── T1008: Snaps ──────────────────────────────────────────
      snaps: {
        Row: {
          id: string
          user_id: string
          snap_date: string
          photo_url: string | null
          caption: string | null
          reaction_emoji: string | null
          window_opened_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          snap_date?: string
          photo_url?: string | null
          caption?: string | null
          reaction_emoji?: string | null
          window_opened_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          snap_date?: string
          photo_url?: string | null
          caption?: string | null
          reaction_emoji?: string | null
          window_opened_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "snaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      media_files: {
        Row: {
          id: string
          uploader_id: string
          source_table: string
          source_column: string
          source_row_id: string
          storage_bucket: string
          storage_path: string
          google_drive_file_id: string | null
          google_drive_folder: string | null
          original_filename: string | null
          content_type: string
          file_size_bytes: number | null
          compressed_size_bytes: number | null
          width: number | null
          height: number | null
          status: string
          exported_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          uploader_id: string
          source_table: string
          source_column: string
          source_row_id: string
          storage_bucket: string
          storage_path: string
          google_drive_file_id?: string | null
          google_drive_folder?: string | null
          original_filename?: string | null
          content_type?: string
          file_size_bytes?: number | null
          compressed_size_bytes?: number | null
          width?: number | null
          height?: number | null
          status?: string
          exported_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          uploader_id?: string
          source_table?: string
          source_column?: string
          source_row_id?: string
          storage_bucket?: string
          storage_path?: string
          google_drive_file_id?: string | null
          google_drive_folder?: string | null
          original_filename?: string | null
          content_type?: string
          file_size_bytes?: number | null
          compressed_size_bytes?: number | null
          width?: number | null
          height?: number | null
          status?: string
          exported_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_files_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      snap_schedule: {
        Row: {
          id: string
          schedule_date: string
          trigger_time: string
          created_at: string
        }
        Insert: {
          id?: string
          schedule_date: string
          trigger_time: string
          created_at?: string
        }
        Update: {
          id?: string
          schedule_date?: string
          trigger_time?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      generate_snap_schedule: {
        Args: Record<string, never>
        Returns: undefined
      }
      pair_partners: {
        Args: {
          my_id: string
          partner_code: string
        }
        Returns: Json
      }
      unpair_partners: {
        Args: {
          my_id: string
        }
        Returns: Json
      }
      resolve_challenge_payout: {
        Args: {
          p_challenge_id: string
          p_winner_id: string
          p_amount: number
        }
        Returns: undefined
      }
      refund_challenge_stake: {
        Args: {
          p_challenge_id: string
        }
        Returns: undefined
      }
      confirm_bounty_claim: {
        Args: {
          p_claim_id: string
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
  }
}
