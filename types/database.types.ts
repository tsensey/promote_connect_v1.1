export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          actor_role: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          actor_role?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          actor_role?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_a: string | null
          participant_b: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_a?: string | null
          participant_b?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_a?: string | null
          participant_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_a_fkey"
            columns: ["participant_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_b_fkey"
            columns: ["participant_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      espaces: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          nom: string
          sort_order: number
          type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          nom: string
          sort_order?: number
          type?: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          nom?: string
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      evenements: {
        Row: {
          created_at: string | null
          description: string | null
          ends_at: string
          id: string
          pavillon: string | null
          salle: string | null
          speakers: Json | null
          starts_at: string
          titre: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ends_at: string
          id?: string
          pavillon?: string | null
          salle?: string | null
          speakers?: Json | null
          starts_at: string
          titre: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          pavillon?: string | null
          salle?: string | null
          speakers?: Json | null
          starts_at?: string
          titre?: string
          type?: string | null
        }
        Relationships: []
      }
      exposant_views: {
        Row: {
          created_at: string | null
          exposant_id: string | null
          id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          exposant_id?: string | null
          id?: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          exposant_id?: string | null
          id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exposant_views_exposant_id_fkey"
            columns: ["exposant_id"]
            isOneToOne: false
            referencedRelation: "exposants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exposant_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exposants: {
        Row: {
          annee_creation: string | null
          brochure_url: string | null
          chiffre_affaires: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          email_contact: string | null
          espace_id: string | null
          facebook_url: string | null
          gallery_urls: Json | null
          id: string
          instagram_url: string | null
          is_featured: boolean | null
          linkedin_url: string | null
          logo_url: string | null
          long_description: string | null
          nom: string
          nombre_employes: string | null
          pavillon: string | null
          pays: string | null
          phone_contact: string | null
          profile_id: string | null
          secteur: string | null
          stand: string | null
          twitter_url: string | null
          video_url: string | null
          website: string | null
        }
        Insert: {
          annee_creation?: string | null
          brochure_url?: string | null
          chiffre_affaires?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          email_contact?: string | null
          espace_id?: string | null
          facebook_url?: string | null
          gallery_urls?: Json | null
          id?: string
          instagram_url?: string | null
          is_featured?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          long_description?: string | null
          nom: string
          nombre_employes?: string | null
          pavillon?: string | null
          pays?: string | null
          phone_contact?: string | null
          profile_id?: string | null
          secteur?: string | null
          stand?: string | null
          twitter_url?: string | null
          video_url?: string | null
          website?: string | null
        }
        Update: {
          annee_creation?: string | null
          brochure_url?: string | null
          chiffre_affaires?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          email_contact?: string | null
          espace_id?: string | null
          facebook_url?: string | null
          gallery_urls?: Json | null
          id?: string
          instagram_url?: string | null
          is_featured?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          long_description?: string | null
          nom?: string
          nombre_employes?: string | null
          pavillon?: string | null
          pays?: string | null
          phone_contact?: string | null
          profile_id?: string | null
          secteur?: string | null
          stand?: string | null
          twitter_url?: string | null
          video_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exposants_espace_id_fkey"
            columns: ["espace_id"]
            isOneToOne: false
            referencedRelation: "espaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exposants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          product_attachment: Json | null
          reply_to_id: string | null
          sender_id: string | null
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          product_attachment?: Json | null
          reply_to_id?: string | null
          sender_id?: string | null
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          product_attachment?: Json | null
          reply_to_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_editions: {
        Row: {
          contenu: string | null
          created_at: string | null
          id: string
          recipient_count: number | null
          sent_at: string | null
          titre: string
        }
        Insert: {
          contenu?: string | null
          created_at?: string | null
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          titre: string
        }
        Update: {
          contenu?: string | null
          created_at?: string | null
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          titre?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string | null
          email: string
          frequency: string | null
          id: string
          is_active: boolean | null
          profile_id: string | null
          sectors: string[] | null
          unsubscribe_token: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          sectors?: string[] | null
          unsubscribe_token?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          sectors?: string[] | null
          unsubscribe_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json
          id: string
          is_read: boolean
          profile_id: string
          sender_id: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          profile_id: string
          sender_id: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          profile_id?: string
          sender_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_comment_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          attachment_url: string | null
          author_id: string
          category: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_pinned: boolean | null
          likes_count: number | null
          repost_of_id: string | null
          reposts_count: number | null
          shares_count: number | null
          type: string
        }
        Insert: {
          attachment_url?: string | null
          author_id: string
          category?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          repost_of_id?: string | null
          reposts_count?: number | null
          shares_count?: number | null
          type?: string
        }
        Update: {
          attachment_url?: string | null
          author_id?: string
          category?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          repost_of_id?: string | null
          reposts_count?: number | null
          shares_count?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_repost_of_id_fkey"
            columns: ["repost_of_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      produits: {
        Row: {
          categorie: string | null
          created_at: string | null
          description: string | null
          exposant_id: string | null
          id: string
          image_url: string | null
          nom: string
          prix_indicatif: string | null
          type: string | null
        }
        Insert: {
          categorie?: string | null
          created_at?: string | null
          description?: string | null
          exposant_id?: string | null
          id?: string
          image_url?: string | null
          nom: string
          prix_indicatif?: string | null
          type?: string | null
        }
        Update: {
          categorie?: string | null
          created_at?: string | null
          description?: string | null
          exposant_id?: string | null
          id?: string
          image_url?: string | null
          nom?: string
          prix_indicatif?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produits_exposant_id_fkey"
            columns: ["exposant_id"]
            isOneToOne: false
            referencedRelation: "exposants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_level: string
          avatar_url: string | null
          company: string | null
          country: string | null
          created_at: string | null
          daily_exchange_count: number
          full_name: string | null
          id: string
          is_active: boolean
          last_exchange_reset: string | null
          pavillon: string | null
          role: string | null
          sector: string | null
          suspended_at: string | null
          suspended_reason: string | null
        }
        Insert: {
          access_level?: string
          avatar_url?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          daily_exchange_count?: number
          full_name?: string | null
          id: string
          is_active?: boolean
          last_exchange_reset?: string | null
          pavillon?: string | null
          role?: string | null
          sector?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
        }
        Update: {
          access_level?: string
          avatar_url?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          daily_exchange_count?: number
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_exchange_reset?: string | null
          pavillon?: string | null
          role?: string | null
          sector?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
        }
        Relationships: []
      }
      rendez_vous: {
        Row: {
          created_at: string | null
          demandeur_id: string | null
          destinataire_id: string | null
          ends_at: string
          id: string
          notes: string | null
          starts_at: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          demandeur_id?: string | null
          destinataire_id?: string | null
          ends_at: string
          id?: string
          notes?: string | null
          starts_at: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          demandeur_id?: string | null
          destinataire_id?: string | null
          ends_at?: string
          id?: string
          notes?: string | null
          starts_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rendez_vous_demandeur_id_fkey"
            columns: ["demandeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_destinataire_id_fkey"
            columns: ["destinataire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_admin: boolean | null
          sender_id: string | null
          ticket_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          sender_id?: string | null
          ticket_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          sender_id?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          profile_id: string | null
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          profile_id?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          profile_id?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          language: string
          notify_feed: boolean
          notify_messages: boolean
          notify_newsletter: boolean
          notify_rdv: boolean
          notify_sound: boolean
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          notify_feed?: boolean
          notify_messages?: boolean
          notify_newsletter?: boolean
          notify_rdv?: boolean
          notify_sound?: boolean
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          notify_feed?: boolean
          notify_messages?: boolean
          notify_newsletter?: boolean
          notify_rdv?: boolean
          notify_sound?: boolean
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_premium: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
