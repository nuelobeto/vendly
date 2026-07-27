/**
 * Hand-written to match supabase/migrations/. Once the project exists, replace
 * this file with generated types:
 *
 *   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts
 */

export type Currency = "USD" | "EUR" | "GBP" | "NGN" | "CAD" | "AUD"

export type OnboardingStep = "profile" | "store" | "complete"

export type StoreRole = "owner" | "admin" | "staff"

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          onboarding_step: OnboardingStep
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          onboarding_step?: OnboardingStep
          created_at?: string
          updated_at?: string
        }
        Update: {
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          onboarding_step?: OnboardingStep
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          logo_url: string | null
          banner_url: string | null
          currency: Currency
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          logo_url?: string | null
          banner_url?: string | null
          currency?: Currency
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          logo_url?: string | null
          banner_url?: string | null
          currency?: Currency
          contact_email?: string | null
          contact_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_invites: {
        Row: {
          id: string
          store_id: string
          email: string
          role: StoreRole
          token_hash: string
          invited_by: string
          expires_at: string
          accepted_at: string | null
          accepted_by: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          email: string
          role?: StoreRole
          token_hash: string
          invited_by: string
          expires_at?: string
        }
        Update: {
          revoked_at?: string | null
        }
        Relationships: []
      }
      store_members: {
        Row: {
          id: string
          store_id: string
          user_id: string
          role: StoreRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          user_id: string
          role?: StoreRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: StoreRole
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      is_slug_available: {
        Args: { candidate: string }
        Returns: boolean
      }
      generate_store_slug: {
        Args: { base_name: string }
        Returns: string
      }
      is_store_member: {
        Args: { p_store_id: string }
        Returns: boolean
      }
      has_store_role: {
        Args: { p_store_id: string; p_roles: StoreRole[] }
        Returns: boolean
      }
      get_store_invite: {
        Args: { p_token_hash: string }
        Returns: {
          invite_id: string
          store_name: string
          store_slug: string
          store_logo_url: string | null
          invite_role: StoreRole
          invite_email: string
          invited_by_name: string | null
          status: string
        }[]
      }
      accept_store_invite: {
        Args: { p_token_hash: string }
        Returns: string
      }
      has_pending_invite: {
        Args: Record<string, never>
        Returns: boolean
      }
      accept_my_invites: {
        Args: Record<string, never>
        Returns: number
      }
      get_store_team: {
        Args: { p_store_id: string }
        Returns: {
          member_id: string
          user_id: string
          member_role: StoreRole
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          email: string | null
          joined_at: string
        }[]
      }
    }
    Enums: {
      currency: Currency
      onboarding_step: OnboardingStep
      store_role: StoreRole
    }
    CompositeTypes: Record<never, never>
  }
}
