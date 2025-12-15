
import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const env = import.meta.env || {};

// @ts-ignore
const supabaseUrl = env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const isConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));

export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder',
  {
    auth: {
      persistSession: isConfigured,
      autoRefreshToken: isConfigured,
      detectSessionInUrl: isConfigured,
    }
  }
);

export const isSupabaseConfigured = () => isConfigured;
