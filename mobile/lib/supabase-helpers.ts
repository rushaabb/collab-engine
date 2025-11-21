import { supabase } from './supabase';
import { User, Collab, Message } from './supabase-types';

// User helpers
export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUser(userId: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Collab helpers
export async function getCollab(collabId: string): Promise<Collab | null> {
  const { data, error } = await supabase
    .from('collabs')
    .select('*')
    .eq('id', collabId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getCollabsByUser(userId: string): Promise<Collab[]> {
  const { data, error } = await supabase
    .from('collabs')
    .select('*')
    .or(`creator1.eq.${userId},creator2.eq.${userId}`)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createCollab(collabData: Omit<Collab, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('collabs')
    .insert(collabData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCollab(collabId: string, updates: Partial<Collab>) {
  const { data, error } = await supabase
    .from('collabs')
    .update(updates)
    .eq('id', collabId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Message helpers
export async function getMessages(collabId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('collabId', collabId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function sendMessage(messageData: Omit<Message, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Card data helpers (for collab card_data JSONB field)
export interface CollabCardData {
  title?: string;
  objective?: string;
  description?: string;
  deliverables?: string[];
  required_skills?: string[];
  tags?: string[];
  collab_type?: string;
  who_posts?: 'creator1' | 'creator2' | 'both';
  deadline?: string;
}

export function parseCardData(cardData: Record<string, any>): CollabCardData {
  return cardData as CollabCardData;
}

export function createCardData(data: CollabCardData): Record<string, any> {
  return data as Record<string, any>;
}

