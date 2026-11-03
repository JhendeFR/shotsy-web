import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color_hex: string;
  is_vip: boolean;
}

export interface Challenge {
  id: number;
  category_id: number;
  type: string;
  content: string;
  drinks_penalty: number;
  is_vip: boolean;
  active?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  is_vip: boolean;
  is_banned: boolean;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface ChallengeSuggestion {
  id: number;
  user_id?: string;
  user_email?: string;
  category_id: number;
  category_name?: string;
  content: string;
  drinks_penalty: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}
