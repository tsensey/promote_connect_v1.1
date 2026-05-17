import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ExtendedTables = {
  post_reactions: {
    Row: { id: string; post_id: string; user_id: string; type: string; created_at: string | null };
    Insert: { id?: string; post_id: string; user_id: string; type: string; created_at?: string | null };
    Update: { id?: string; post_id?: string; user_id?: string; type?: string; created_at?: string | null };
  };
  post_saves: {
    Row: { id: string; post_id: string; user_id: string; created_at: string | null };
    Insert: { id?: string; post_id: string; user_id: string; created_at?: string | null };
    Update: { id?: string; post_id?: string; user_id?: string; created_at?: string | null };
  };
  user_follows: {
    Row: { id: string; follower_id: string; following_id: string; created_at: string | null };
    Insert: { id?: string; follower_id: string; following_id: string; created_at?: string | null };
    Update: { id?: string; follower_id?: string; following_id?: string; created_at?: string | null };
  };
};

type AllTables = Database['public']['Tables'] & ExtendedTables;

export type ExtendedSupabaseClient = SupabaseClient<{
  public: {
    Tables: AllTables;
    Views: Database['public']['Views'];
    Functions: Database['public']['Functions'];
    Enums: Database['public']['Enums'];
    CompositeTypes: Database['public']['CompositeTypes'];
  };
}>;
