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
}