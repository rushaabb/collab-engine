// TypeScript types matching the Supabase schema

export interface User {
  id: string;
  name: string;
  niche_tags: string[];
  follower_bucket: string | null;
  style_tags: string[];
  reliability_score: number;
  completed_collabs: number;
  created_at: string;
  updated_at: string;
}

export interface Collab {
  id: string;
  creator1: string;
  creator2: string | null;
  card_data: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  proof_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  collabId: string;
  sender: string;
  text: string;
  created_at: string;
}

// Database helper types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      collabs: {
        Row: Collab;
        Insert: Omit<Collab, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Collab, 'id' | 'created_at' | 'updated_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
    };
  };
};

