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
          email: string
          full_name: string | null
          avatar_url: string | null
          plan: 'starter' | 'pro'
          subscription_id: string | null
          subscription_status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | null
          customer_id: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'starter' | 'pro'
          subscription_id?: string | null
          subscription_status?: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | null
          customer_id?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'starter' | 'pro'
          subscription_id?: string | null
          subscription_status?: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | null
          customer_id?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      usage: {
        Row: {
          id: string
          user_id: string
          month: string
          listings_generated: number
          words_generated: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          listings_generated?: number
          words_generated?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          listings_generated?: number
          words_generated?: number
          created_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          prompt: string
          result: Json
          word_count: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          result: Json
          word_count?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          result?: Json
          word_count?: number
          metadata?: Json
          created_at?: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          excerpt: string | null
          featured_image: string | null
          published: boolean
          seo_title: string | null
          seo_description: string | null
          tags: string[]
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: string
          excerpt?: string | null
          featured_image?: string | null
          published?: boolean
          seo_title?: string | null
          seo_description?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string
          excerpt?: string | null
          featured_image?: string | null
          published?: boolean
          seo_title?: string | null
          seo_description?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
      email_subscribers: {
        Row: {
          id: string
          email: string
          subscribed_at: string
          unsubscribed_at: string | null
          source: string
          metadata: Json
        }
        Insert: {
          id?: string
          email: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          source?: string
          metadata?: Json
        }
        Update: {
          id?: string
          email?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          source?: string
          metadata?: Json
        }
      }
      webhook_events: {
        Row: {
          id: string
          type: string
          processed_at: string
          data: Json
        }
        Insert: {
          id: string
          type: string
          processed_at?: string
          data: Json
        }
        Update: {
          id?: string
          type?: string
          processed_at?: string
          data?: Json
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Usage = Database['public']['Tables']['usage']['Row']
export type Generation = Database['public']['Tables']['generations']['Row']
export type BlogPost = Database['public']['Tables']['blog_posts']['Row']