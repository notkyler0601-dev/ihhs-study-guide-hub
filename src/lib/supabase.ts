// Supabase client singleton.
// Returns null when env vars are not set; the app then falls back to
// local-only mode via auth.ts and storage.ts.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

export const isCloudMode = (): boolean => Boolean(url && anon);

export const supabase = (): SupabaseClient | null => {
  if (!isCloudMode()) return null;
  if (!client) {
    client = createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'ihhs:sb-auth',
      },
    });
  }
  return client;
};
