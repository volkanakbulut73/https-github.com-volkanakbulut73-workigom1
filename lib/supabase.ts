
import { createClient } from '@supabase/supabase-js';

/**
 * Fix: Cast import.meta to any to safely access Vite's environment variables 
 * even if vite/client type definitions are not correctly loaded in the TS context.
 */
const env: any = (import.meta as any).env || {};

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
