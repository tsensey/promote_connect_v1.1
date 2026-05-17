export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          company: string | null;
          role: string | null;
          sector: string | null;
          country: string | null;
          pavillon: string | null;
          avatar_url: string | null;
          is_active: boolean;
          suspended_at: string | null;
          suspended_reason: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          company?: string | null;
          role?: string | null;
          sector?: string | null;
          country?: string | null;
          pavillon?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          company?: string | null;
          role?: string | null;
          sector?: string | null;
          country?: string | null;
          pavillon?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      exposants: {
        Row: {
          id: string;
          profile_id: string | null;
          nom: string;
          description: string | null;
          long_description: string | null;
          secteur: string | null;
          pavillon: string | null;
          stand: string | null;
          pays: string | null;
          website: string | null;
          logo_url: string | null;
          cover_url: string | null;
          brochure_url: string | null;
          video_url: string | null;
          email_contact: string | null;
          phone_contact: string | null;
          facebook_url: string | null;
          linkedin_url: string | null;
          twitter_url: string | null;
          instagram_url: string | null;
          chiffre_affaires: string | null;
          annee_creation: string | null;
          nombre_employes: string | null;
          is_featured: boolean;
          gallery_urls: string[] | null;
          espace_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          nom: string;
          description?: string | null;
          long_description?: string | null;
          secteur?: string | null;
          pavillon?: string | null;
          stand?: string | null;
          pays?: string | null;
          website?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          brochure_url?: string | null;
          video_url?: string | null;
          email_contact?: string | null;
          phone_contact?: string | null;
          facebook_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          instagram_url?: string | null;
          chiffre_affaires?: string | null;
          annee_creation?: string | null;
          nombre_employes?: string | null;
          is_featured?: boolean;
          gallery_urls?: string[] | null;
          espace_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          nom?: string;
          description?: string | null;
          long_description?: string | null;
          secteur?: string | null;
          pavillon?: string | null;
          stand?: string | null;
          pays?: string | null;
          website?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          brochure_url?: string | null;
          video_url?: string | null;
          email_contact?: string | null;
          phone_contact?: string | null;
          facebook_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          instagram_url?: string | null;
          chiffre_affaires?: string | null;
          annee_creation?: string | null;
          nombre_employes?: string | null;
          is_featured?: boolean;
          gallery_urls?: string[] | null;
          espace_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      exposant_views: {
        Row: {
          id: string;
          exposant_id: string | null;
          viewer_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          exposant_id?: string | null;
          viewer_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          exposant_id?: string | null;
          viewer_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'exposant_views_exposant_id_fkey';
            columns: ['exposant_id'];
            isRelationOneToOne: false;
            referencedRelation: 'exposants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exposant_views_viewer_id_fkey';
            columns: ['viewer_id'];
            isRelationOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      produits: {
        Row: {
          id: string;
          exposant_id: string | null;
          nom: string;
          description: string | null;
          categorie: string | null;
          image_url: string | null;
          prix_indicatif: string | null;
          type: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          exposant_id?: string | null;
          nom: string;
          description?: string | null;
          categorie?: string | null;
          image_url?: string | null;
          prix_indicatif?: string | null;
          type?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          exposant_id?: string | null;
          nom?: string;
          description?: string | null;
          categorie?: string | null;
          image_url?: string | null;
          prix_indicatif?: string | null;
          type?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          participant_a: string | null;
          participant_b: string | null;
          last_message_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          participant_a?: string | null;
          participant_b?: string | null;
          last_message_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          participant_a?: string | null;
          participant_b?: string | null;
          last_message_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          attachment_url: string | null;
          attachment_type: 'image' | 'document' | 'product' | null;
          reply_to_id: string | null;
          product_attachment: {
            id: string;
            nom: string;
            image_url: string | null;
            prix_indicatif: string | null;
            exposant_nom: string;
            exposant_id: string;
          } | null;
          is_read: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          attachment_url?: string | null;
          attachment_type?: 'image' | 'document' | 'product' | null;
          reply_to_id?: string | null;
          product_attachment?: {
            id: string;
            nom: string;
            image_url: string | null;
            prix_indicatif: string | null;
            exposant_nom: string;
            exposant_id: string;
          } | null;
          is_read?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          attachment_url?: string | null;
          attachment_type?: 'image' | 'document' | 'product' | null;
          reply_to_id?: string | null;
          product_attachment?: {
            id: string;
            nom: string;
            image_url: string | null;
            prix_indicatif: string | null;
            exposant_nom: string;
            exposant_id: string;
          } | null;
          is_read?: boolean;
          created_at?: string | null;
        };
        Relationships: [];
      };
      evenements: {
        Row: {
          id: string;
          titre: string;
          description: string | null;
          pavillon: string | null;
          salle: string | null;
          starts_at: string;
          ends_at: string;
          type: string | null;
          speakers: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          titre: string;
          description?: string | null;
          pavillon?: string | null;
          salle?: string | null;
          starts_at: string;
          ends_at: string;
          type?: string | null;
          speakers?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          titre?: string;
          description?: string | null;
          pavillon?: string | null;
          salle?: string | null;
          starts_at?: string;
          ends_at?: string;
          type?: string | null;
          speakers?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      rendez_vous: {
        Row: {
          id: string;
          demandeur_id: string | null;
          destinataire_id: string | null;
          starts_at: string;
          ends_at: string;
          status: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          demandeur_id?: string | null;
          destinataire_id?: string | null;
          starts_at: string;
          ends_at: string;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          demandeur_id?: string | null;
          destinataire_id?: string | null;
          starts_at?: string;
          ends_at?: string;
          status?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          profile_id: string | null;
          subject: string;
          description: string | null;
          status: string | null;
          priority: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          subject: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          subject?: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      support_messages: {
        Row: {
          id: string;
          ticket_id: string | null;
          sender_id: string | null;
          content: string;
          is_admin: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          ticket_id?: string | null;
          sender_id?: string | null;
          content: string;
          is_admin?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          ticket_id?: string | null;
          sender_id?: string | null;
          content?: string;
          is_admin?: boolean;
          created_at?: string | null;
        };
        Relationships: [];
      };
      newsletter_subscriptions: {
        Row: {
          id: string;
          profile_id: string | null;
          email: string;
          sectors: string[] | null;
          frequency: string | null;
          is_active: boolean;
          unsubscribe_token: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          email: string;
          sectors?: string[] | null;
          frequency?: string | null;
          is_active?: boolean;
          unsubscribe_token?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          email?: string;
          sectors?: string[] | null;
          frequency?: string | null;
          is_active?: boolean;
          unsubscribe_token?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      newsletter_editions: {
        Row: {
          id: string;
          titre: string;
          contenu: string | null;
          sent_at: string | null;
          recipient_count: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          titre: string;
          contenu?: string | null;
          sent_at?: string | null;
          recipient_count?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          titre?: string;
          contenu?: string | null;
          sent_at?: string | null;
          recipient_count?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          content: string;
          type: string;
          category: string | null;
          image_url: string | null;
          attachment_url: string | null;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          reposts_count: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          content: string;
          type?: string;
          category?: string | null;
          image_url?: string | null;
          attachment_url?: string | null;
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          reposts_count?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string;
          content?: string;
          type?: string;
          category?: string | null;
          image_url?: string | null;
          attachment_url?: string | null;
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          reposts_count?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_author_id_fkey';
            columns: ['author_id'];
            isRelationOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'post_likes_post_id_fkey';
            columns: ['post_id'];
            isRelationOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_likes_user_id_fkey';
            columns: ['user_id'];
            isRelationOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_comment_id: string | null;
          likes_count: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_comment_id?: string | null;
          likes_count?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          likes_count?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'post_comments_post_id_fkey';
            columns: ['post_id'];
            isRelationOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_comments_author_id_fkey';
            columns: ['author_id'];
            isRelationOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      post_shares: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          type: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          type?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          type?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'post_shares_post_id_fkey';
            columns: ['post_id'];
            isRelationOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_shares_user_id_fkey';
            columns: ['user_id'];
            isRelationOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          profile_id: string;
          language: string;
          notify_messages: boolean;
          notify_rdv: boolean;
          notify_newsletter: boolean;
          notify_feed: boolean;
          notify_sound: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          language?: string;
          notify_messages?: boolean;
          notify_rdv?: boolean;
          notify_newsletter?: boolean;
          notify_feed?: boolean;
          notify_sound?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          language?: string;
          notify_messages?: boolean;
          notify_rdv?: boolean;
          notify_newsletter?: boolean;
          notify_feed?: boolean;
          notify_sound?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_profile_id_fkey';
            columns: ['profile_id'];
            isRelationOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      espaces: {
        Row: {
          id: string;
          code: string;
          nom: string;
          description: string | null;
          type: string;
          sort_order: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          nom: string;
          description?: string | null;
          type?: string;
          sort_order?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          nom?: string;
          description?: string | null;
          type?: string;
          sort_order?: number;
          created_at?: string | null;
        };
        Relationships: [];
      };
      blocked_users: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          reason?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          reason?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blocked_users_blocker_id_fkey';
            columns: ['blocker_id'];
            isRelationOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocked_users_blocked_id_fkey';
            columns: ['blocked_id'];
            isRelationOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          sender_id: string;
          type: string;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          sender_id: string;
          type: string;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          sender_id?: string;
          type?: string;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_profile_id_fkey';
            columns: ['profile_id'];
            isRelationOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_sender_id_fkey';
            columns: ['sender_id'];
            isRelationOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    audit_logs: {
      Row: {
        id: string;
        actor_id: string;
        actor_email: string | null;
        actor_role: string;
        action: string;
        entity_type: string;
        entity_id: string | null;
        metadata: Record<string, unknown> | null;
        ip_address: string | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        actor_id: string;
        actor_email?: string | null;
        actor_role?: string;
        action: string;
        entity_type: string;
        entity_id?: string | null;
        metadata?: Record<string, unknown> | null;
        ip_address?: string | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        actor_id?: string;
        actor_email?: string | null;
        actor_role?: string;
        action?: string;
        entity_type?: string;
        entity_id?: string | null;
        metadata?: Record<string, unknown> | null;
        ip_address?: string | null;
        created_at?: string;
      };
      Relationships: [
        {
          foreignKeyName: 'audit_logs_actor_id_fkey';
          columns: ['actor_id'];
          isRelationOneToOne: false;
          referencedRelation: 'profiles';
          referencedColumns: ['id'];
        }
      ];
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
