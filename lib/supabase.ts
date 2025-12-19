
import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const env = import.meta.env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Detaylı yapılandırma kontrolü
const isConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
  !supabaseUrl.includes('placeholder') && 
  supabaseUrl.startsWith('https://');

if (!isConfigured) {
  console.warn("Workigom: Supabase yapılandırması eksik veya hatalı. Uygulama demo modunda çalışacaktır.");
}

export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'workigom-auth-token'
    }
  }
);

export const isSupabaseConfigured = () => isConfigured;
