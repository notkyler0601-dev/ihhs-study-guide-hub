// Authentication with hybrid local + cloud modes.
//
// - If PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY are set:
//     Supabase Auth handles signup/login. Email + password required.
//     Cross-device sync works.
// - Otherwise:
//     Local-only mode. Username-only signup. No sync.
//
// `currentUser()` is kept synchronous by caching the user in localStorage.
// After login/signup, the cache is populated; every consumer reads instantly.

import { isCloudMode, supabase } from './supabase';

export interface Account {
  id: string;
  username: string;
  displayName: string;
  isAdmin?: boolean;
  email?: string;
  createdAt: string;
}

const ACCOUNTS_KEY = 'ihhs:accounts';   // list of locally-known accounts
const SESSION_KEY = 'ihhs:session';     // { id } pointer to current account
const CACHE_KEY = 'ihhs:cache:user';    // cached Account for sync reads

const isClient = () => typeof window !== 'undefined';

const safeRead = <T>(key: string, fallback: T): T => {
  if (!isClient()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = (key: string, value: unknown) => {
  if (!isClient()) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

const safeRemove = (key: string) => {
  if (!isClient()) return;
  try { localStorage.removeItem(key); } catch {}
};

const newId = () => 'u_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36).slice(-4);

const validUsername = (u: string) => /^[a-z0-9_.-]{3,20}$/.test(u);

// ============================================================
// Cache and listeners
// ============================================================

const LISTENERS: Array<(u: Account | null) => void> = [];
export const onAuthChange = (cb: (u: Account | null) => void): (() => void) => {
  LISTENERS.push(cb);
  return () => {
    const i = LISTENERS.indexOf(cb);
    if (i >= 0) LISTENERS.splice(i, 1);
  };
};
const notifyChange = () => {
  const u = currentUser();
  LISTENERS.forEach((l) => { try { l(u); } catch {} });
  if (isClient()) {
    window.dispatchEvent(new CustomEvent('ihhs:auth', { detail: u }));
  }
};

export const currentUser = (): Account | null => safeRead<Account | null>(CACHE_KEY, null);

const setCache = (account: Account | null) => {
  if (account) safeWrite(CACHE_KEY, account);
  else safeRemove(CACHE_KEY);
};

// ============================================================
// Shared types
// ============================================================

export type SignupResult = { ok: true; account: Account } | { ok: false; error: string };
export type LoginResult = { ok: true; account: Account } | { ok: false; error: string };

// ============================================================
// Local mode implementation
// ============================================================

const listLocalAccounts = (): Account[] => safeRead<Account[]>(ACCOUNTS_KEY, []);
const findLocalByUsername = (username: string): Account | null =>
  listLocalAccounts().find((a) => a.username === username.toLowerCase()) ?? null;

const signupLocal = (username: string, displayName: string): SignupResult => {
  const u = username.trim().toLowerCase();
  const d = displayName.trim() || username.trim();
  if (!validUsername(u)) {
    return { ok: false, error: 'Username must be 3-20 chars: lowercase letters, numbers, _ . -' };
  }
  if (findLocalByUsername(u)) {
    return { ok: false, error: 'That username is already taken on this device.' };
  }
  const account: Account = {
    id: newId(),
    username: u,
    displayName: d,
    createdAt: new Date().toISOString(),
  };
  const accounts = listLocalAccounts();
  accounts.push(account);
  safeWrite(ACCOUNTS_KEY, accounts);
  safeWrite(SESSION_KEY, { id: account.id });
  setCache(account);
  notifyChange();
  return { ok: true, account };
};

const loginLocal = (username: string): LoginResult => {
  const account = findLocalByUsername(username.trim());
  if (!account) return { ok: false, error: 'No account with that username on this device.' };
  safeWrite(SESSION_KEY, { id: account.id });
  setCache(account);
  notifyChange();
  return { ok: true, account };
};

// ============================================================
// Cloud mode (Supabase) implementation
// ============================================================

const profileToAccount = (row: {
  id: string; username: string; display_name: string; is_admin: boolean; created_at: string;
}, email?: string): Account => ({
  id: row.id,
  username: row.username,
  displayName: row.display_name,
  isAdmin: row.is_admin,
  email,
  createdAt: row.created_at,
});

export const signupCloud = async (
  username: string,
  displayName: string,
  email: string,
  password: string,
): Promise<SignupResult> => {
  const sb = supabase();
  if (!sb) return { ok: false, error: 'Cloud mode is not configured.' };

  const u = username.trim().toLowerCase();
  const d = displayName.trim() || username.trim();
  if (!validUsername(u)) {
    return { ok: false, error: 'Username must be 3-20 chars: lowercase letters, numbers, _ . -' };
  }

  // Pre-check username availability (profiles.select is public).
  const { data: existing } = await sb.from('profiles').select('id').eq('username', u).maybeSingle();
  if (existing) return { ok: false, error: 'That username is already taken.' };

  // Pass username + display_name via user metadata. A database trigger
  // (handle_new_user in schema.sql) creates the matching profile row with
  // elevated privileges, bypassing the RLS that would block a direct insert
  // when no session exists yet (email-confirmation-on case).
  const { data: authData, error: authErr } = await sb.auth.signUp({
    email,
    password,
    options: { data: { username: u, display_name: d } },
  });
  if (authErr || !authData.user) {
    return { ok: false, error: authErr?.message ?? 'Could not create account.' };
  }

  // Fetch the profile the trigger just created. Retry briefly in case of
  // replication lag on self-hosted projects.
  let profile: { id: string; username: string; display_name: string; is_admin: boolean; created_at: string } | null = null;
  for (let i = 0; i < 4 && !profile; i++) {
    const { data } = await sb
      .from('profiles')
      .select('id, username, display_name, is_admin, created_at')
      .eq('id', authData.user.id)
      .maybeSingle();
    profile = data ?? null;
    if (!profile) await new Promise((r) => setTimeout(r, 150));
  }
  if (!profile) {
    return { ok: false, error: 'Account created but profile not found. Refresh and try logging in.' };
  }

  const account = profileToAccount(profile, email);
  setCache(account);
  // Also add to local known-accounts list (so /login autocomplete shows it).
  const accounts = listLocalAccounts().filter((a) => a.id !== account.id);
  accounts.push(account);
  safeWrite(ACCOUNTS_KEY, accounts);
  safeWrite(SESSION_KEY, { id: account.id });
  notifyChange();
  return { ok: true, account };
};

export const loginCloud = async (
  emailOrUsername: string,
  password: string,
): Promise<LoginResult> => {
  const sb = supabase();
  if (!sb) return { ok: false, error: 'Cloud mode is not configured.' };

  let email = emailOrUsername.trim();
  // If they typed a username instead of an email, look up the email via profiles.
  if (!email.includes('@')) {
    // Usernames are publicly selectable (RLS allows it) so we can look up the owner's user_id,
    // but Supabase Auth still needs the email to sign in. We don't store email in profiles,
    // so instruct the user to use their email.
    return { ok: false, error: 'Log in with your email address.' };
  }

  const { data: authData, error: authErr } = await sb.auth.signInWithPassword({ email, password });
  if (authErr || !authData.user) {
    return { ok: false, error: authErr?.message ?? 'Invalid email or password.' };
  }

  const { data: profile, error: profileErr } = await sb
    .from('profiles')
    .select('id, username, display_name, is_admin, created_at')
    .eq('id', authData.user.id)
    .single();

  if (profileErr || !profile) {
    return { ok: false, error: 'Profile missing. Contact the site maintainer.' };
  }

  const account = profileToAccount(profile, email);
  setCache(account);
  const accounts = listLocalAccounts().filter((a) => a.id !== account.id);
  accounts.push(account);
  safeWrite(ACCOUNTS_KEY, accounts);
  safeWrite(SESSION_KEY, { id: account.id });
  notifyChange();

  // Hydrate local data cache from the cloud (fire-and-forget).
  void hydrateUserDataFromCloud(account.id);

  return { ok: true, account };
};

// Pull every row of user_data for this user into localStorage so reads stay sync.
const hydrateUserDataFromCloud = async (userId: string) => {
  const sb = supabase();
  if (!sb) return;
  const { data, error } = await sb.from('user_data').select('key, value').eq('user_id', userId);
  if (error || !data) return;
  for (const row of data) {
    try {
      localStorage.setItem(`ihhs:u:${userId}:${row.key}`, JSON.stringify(row.value));
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('ihhs:data-hydrated'));
};

// Called on initial load to re-establish a cloud session (Supabase refreshes tokens automatically).
export const bootstrapCloudSession = async (): Promise<void> => {
  if (!isCloudMode()) return;
  const sb = supabase();
  if (!sb) return;

  const { data: sess } = await sb.auth.getSession();
  const user = sess.session?.user;
  if (!user) {
    // Session expired or logged out elsewhere. Clear cache.
    if (currentUser()?.id) {
      setCache(null);
      safeRemove(SESSION_KEY);
      notifyChange();
    }
    return;
  }

  const { data: profile } = await sb
    .from('profiles')
    .select('id, username, display_name, is_admin, created_at')
    .eq('id', user.id)
    .single();
  if (!profile) return;

  const account = profileToAccount(profile, user.email ?? undefined);
  setCache(account);
  safeWrite(SESSION_KEY, { id: account.id });
  notifyChange();
  void hydrateUserDataFromCloud(account.id);
};

// ============================================================
// Public API (mode-aware)
// ============================================================

export { isCloudMode } from './supabase';

// Legacy signatures preserved so old callers still compile.
// In cloud mode they return a helpful error telling the page to use the async variants.
export const signup = (
  username: string,
  displayName: string,
  email?: string,
  password?: string,
): SignupResult | Promise<SignupResult> => {
  if (isCloudMode()) {
    if (!email || !password) {
      return { ok: false, error: 'Email and password are required.' };
    }
    return signupCloud(username, displayName, email, password);
  }
  return signupLocal(username, displayName);
};

export const login = (
  usernameOrEmail: string,
  password?: string,
): LoginResult | Promise<LoginResult> => {
  if (isCloudMode()) {
    if (!password) return { ok: false, error: 'Password is required.' };
    return loginCloud(usernameOrEmail, password);
  }
  return loginLocal(usernameOrEmail);
};

export const logout = async (): Promise<void> => {
  if (isCloudMode()) {
    const sb = supabase();
    await sb?.auth.signOut();
  }
  safeRemove(SESSION_KEY);
  setCache(null);
  notifyChange();
};

export const listAccounts = (): Account[] => listLocalAccounts();

export const getAccount = (id: string): Account | null =>
  listLocalAccounts().find((a) => a.id === id) ?? null;

export const findByUsername = (username: string): Account | null =>
  findLocalByUsername(username);

export const updateProfile = async (
  patch: Partial<Pick<Account, 'displayName'>>,
): Promise<Account | null> => {
  const me = currentUser();
  if (!me) return null;
  const next = { ...me, ...patch };
  setCache(next);

  if (isCloudMode()) {
    const sb = supabase();
    if (sb && patch.displayName) {
      await sb.from('profiles').update({ display_name: patch.displayName }).eq('id', me.id);
    }
  } else {
    const accounts = listLocalAccounts();
    const idx = accounts.findIndex((a) => a.id === me.id);
    if (idx >= 0) {
      accounts[idx] = next;
      safeWrite(ACCOUNTS_KEY, accounts);
    }
  }
  notifyChange();
  return next;
};

// ============================================================
// Cross-tab sync + initial bootstrap
// ============================================================

if (isClient()) {
  window.addEventListener('storage', (e) => {
    if (e.key === SESSION_KEY || e.key === CACHE_KEY) notifyChange();
  });
  if (isCloudMode()) {
    // Re-hydrate from Supabase on load (refreshes session, updates cache).
    void bootstrapCloudSession();
    // Also listen for auth state changes from Supabase (e.g., token refresh, sign-out elsewhere).
    const sb = supabase();
    sb?.auth.onAuthStateChange(() => void bootstrapCloudSession());
  }
}
