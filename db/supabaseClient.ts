import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url) throw new Error('Falta SUPABASE_URL en variables de entorno');
  if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_ANON_KEY en variables de entorno');

  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
  });

  return cachedClient;
}

