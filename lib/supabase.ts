
import { createClient } from '@supabase/supabase-js';

/**
 * --- SQL KURULUMU VE POLİTİKALAR (RLS) ---
 * Uygulamanın veritabanına yazabilmesi için aşağıdaki SQL komutlarını 
 * Supabase SQL Editöründe çalıştırmanız gerekir.
 * 
 * -- 1. Depolama (Storage) Ayarı (Resimler için)
 * insert into storage.buckets (id, name, public) values ('images', 'images', true);
 * create policy "Resim Yukleme" on storage.objects for insert with check (bucket_id = 'images');
 * create policy "Resim Goruntuleme" on storage.objects for select using (bucket_id = 'images');
 * 
 * -- 2. İlanlar Tablosu Politikaları (Eğer tabloyu oluşturduysanız bunları çalıştırın)
 * alter table public.swap_listings enable row level security;
 * 
 * -- Herkes ilanları görebilir
 * create policy "Ilanlari Goruntuleme" on public.swap_listings for select using (true);
 * 
 * -- Sadece giriş yapmış kullanıcılar ilan ekleyebilir
 * create policy "Ilan Ekleme" on public.swap_listings for insert with check (auth.uid() = owner_id);
 * 
 * -- Sadece ilanın sahibi silebilir
 * create policy "Ilan Silme" on public.swap_listings for delete using (auth.uid() = owner_id);
 */

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
