// Per-user keyed storage.
//
// - Reads stay synchronous from localStorage (so components don't have to
//   be rewritten as async).
// - Writes go to localStorage first, then (in cloud mode) are pushed to
//   the Supabase `user_data` table via a fire-and-forget queue.
// - On login, auth.ts hydrates localStorage from the cloud before the
//   first read. See `hydrateUserDataFromCloud` there.

import { currentUser, isCloudMode } from './auth';
import { supabase } from './supabase';

const isClient = () => typeof window !== 'undefined';

const userKey = (suffix: string): string | null => {
  const me = currentUser();
  if (!me) return null;
  return `ihhs:u:${me.id}:${suffix}`;
};

export const userRead = <T>(suffix: string, fallback: T): T => {
  if (!isClient()) return fallback;
  const k = userKey(suffix);
  if (!k) return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const userWrite = (suffix: string, value: unknown): boolean => {
  if (!isClient()) return false;
  const me = currentUser();
  if (!me) return false;
  const k = `ihhs:u:${me.id}:${suffix}`;
  try {
    localStorage.setItem(k, JSON.stringify(value));
  } catch {
    return false;
  }

  if (isCloudMode()) void pushToCloud(me.id, suffix, value);
  return true;
};

export const userDelete = (suffix: string) => {
  if (!isClient()) return;
  const me = currentUser();
  if (!me) return;
  const k = `ihhs:u:${me.id}:${suffix}`;
  try { localStorage.removeItem(k); } catch {}

  if (isCloudMode()) void deleteFromCloud(me.id, suffix);
};

export const wipeUserData = () => {
  if (!isClient()) return;
  const me = currentUser();
  if (!me) return;
  const prefix = `ihhs:u:${me.id}:`;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));

  if (isCloudMode()) void wipeCloud(me.id);
};

// ============================================================
// Cloud sync (fire-and-forget, with simple debounce per key)
// ============================================================

const pendingWrites = new Map<string, number>();

const pushToCloud = async (userId: string, key: string, value: unknown) => {
  const sb = supabase();
  if (!sb) return;

  // Debounce: coalesce rapid successive writes on the same key.
  const token = (pendingWrites.get(key) ?? 0) + 1;
  pendingWrites.set(key, token);
  await new Promise((r) => setTimeout(r, 200));
  if (pendingWrites.get(key) !== token) return;

  try {
    await sb.from('user_data').upsert(
      { user_id: userId, key, value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' },
    );
  } catch {
    // Silent failure. The localStorage write already succeeded; retry next change.
  }
};

const deleteFromCloud = async (userId: string, key: string) => {
  const sb = supabase();
  if (!sb) return;
  try { await sb.from('user_data').delete().eq('user_id', userId).eq('key', key); } catch {}
};

const wipeCloud = async (userId: string) => {
  const sb = supabase();
  if (!sb) return;
  try { await sb.from('user_data').delete().eq('user_id', userId); } catch {}
};
