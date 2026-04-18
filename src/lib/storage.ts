// Per-user keyed storage. All progress, SRS state, quiz history, etc.
// is namespaced under the active user id so multiple accounts on the
// same browser stay isolated.

import { currentUser } from './auth';

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
  const k = userKey(suffix);
  if (!k) return false;
  try {
    localStorage.setItem(k, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const userDelete = (suffix: string) => {
  if (!isClient()) return;
  const k = userKey(suffix);
  if (!k) return;
  try { localStorage.removeItem(k); } catch {}
};

// Wipe all data for the current user (account stays).
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
};
