
import { createClient } from '@supabase/supabase-js';

// @ts-ignore
/**
 * Fix: Casting env to any to resolve property access errors on potentially empty object.
 */
const env: any = import.meta.env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

/**
 * ÖNEMLİ: Uygulamanın düzgün çalışması için Supabase Dashboard'da RLS politikaları ayarlanmalıdır.
 * 
 * 1. public.profiles:
 *    - SELECT: true (all)
 *    - INSERT/UPDATE: auth.uid() = id
 * 
 * 2. public.transactions:
 *    - SELECT: auth.uid() = seeker_id OR auth.uid() = supporter_id OR status = 'waiting-supporter'
 *    - INSERT: auth.uid() = seeker_id
 *    - UPDATE: auth.uid() = seeker_id OR auth.uid() = supporter_id OR (status = 'waiting-supporter' AND supporter_id IS NULL)
 */

export const isSupabaseConfigured = () => {
  return (
    !!supabaseUrl && 
    !!supabaseAnonKey && 
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl !== 'YOUR_SUPABASE_URL'
  );
};

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
