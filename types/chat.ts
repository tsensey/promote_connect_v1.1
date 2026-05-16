import type { Database } from './database.types';

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface ProductAttachment {
  id: string;
  nom: string;
  image_url: string | null;
  prix_indicatif: string | null;
  exposant_nom: string;
  exposant_id: string;
}

export interface EnrichedConversation extends Conversation {
  other_user: Profile | null;
  other_exposant_nom: string | null;
  other_exposant_logo: string | null;
  last_message_content: string | null;
  unread_count: number;
}

export interface EnrichedMessage extends Message {
  author: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'role'> | null;
  reply_to: Pick<EnrichedMessage, 'id' | 'content' | 'author' | 'attachment_type'> | null;
}

export interface ChatContact {
  profile_id: string;
  display_name: string;
  company: string | null;
  avatar_url: string | null;
  role: string | null;
  exposant_id: string | null;
  exposant_logo: string | null;
}
