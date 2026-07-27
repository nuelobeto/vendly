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
    }
    Enums: {
      currency: Currency
      onboarding_step: OnboardingStep
      store_role: StoreRole
    }
    CompositeTypes: Record<never, never>
  }
}
