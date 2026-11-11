import { createClient } from '@supabase/supabase-js';

const viteEnv = import.meta.env ?? {};
const url = viteEnv.VITE_SUPABASE_URL;
const key = viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key && !url.includes('your-project'));
export const supabase = isSupabaseConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
