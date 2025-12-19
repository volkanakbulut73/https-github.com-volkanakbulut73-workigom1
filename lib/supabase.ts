
import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const env = import.meta.env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Gerçek bir URL ve Key olup olmadığını kontrol et
export const isSupabaseConfigured = () => {
  return (
    !!supabaseUrl && 
    !!supabaseAnonKey && 
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl !== 'YOUR_SUPABASE_URL'
  );
};

// Cast to any to bypass the "Property getSession does not exist on type SupabaseAuthClient" error
// which usually happens if the project has Supabase v1 types but code expects v2.
export const supabase: any = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://invalid-url-to-prevent-json-error.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'invalid-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'workigom-auth-token'
    }
  }
);
