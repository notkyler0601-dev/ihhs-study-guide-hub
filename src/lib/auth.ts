// Local-account authentication system.
// Stores accounts and the active session in localStorage.
// Designed to be swappable: replace these functions with Supabase calls and
// every consumer (UserMenu, dashboard, review, flashcards, quiz) keeps working.

export interface Account {
  id: string;             // stable uuid-ish
  username: string;       // lowercase, unique, 3-20 chars
  displayName: string;
  createdAt: string;
}

const ACCOUNTS_KEY = 'ihhs:accounts';
const SESSION_KEY = 'ihhs:session';

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

const newId = () => 'u_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36).slice(-4);

const validUsername = (u: string) => /^[a-z0-9_.-]{3,20}$/.test(u);

export const listAccounts = (): Account[] => safeRead<Account[]>(ACCOUNTS_KEY, []);

export const getAccount = (id: string): Account | null =>
  listAccounts().find((a) => a.id === id) ?? null;

export const findByUsername = (username: string): Account | null =>
  listAccounts().find((a) => a.username === username.toLowerCase()) ?? null;

export type SignupResult = { ok: true; account: Account } | { ok: false; error: string };

export const signup = (username: string, displayName: string): SignupResult => {
  const u = username.trim().toLowerCase();
  const d = displayName.trim() || username.trim();
  if (!validUsername(u)) {
    return { ok: false, error: 'Username must be 3-20 chars: lowercase letters, numbers, _ . -' };
  }
  if (findByUsername(u)) {
    return { ok: false, error: 'That username is already taken on this device.' };
  }
  const account: Account = {
    id: newId(),
    username: u,
    displayName: d,
    createdAt: new Date().toISOString(),
  };
  const accounts = listAccounts();
  accounts.push(account);
  safeWrite(ACCOUNTS_KEY, accounts);
  safeWrite(SESSION_KEY, { id: account.id });
  notifyChange();
  return { ok: true, account };
};

export type LoginResult = { ok: true; account: Account } | { ok: false; error: string };

export const login = (username: string): LoginResult => {
  const account = findByUsername(username.trim());
  if (!account) return { ok: false, error: 'No account with that username on this device.' };
  safeWrite(SESSION_KEY, { id: account.id });
  notifyChange();
  return { ok: true, account };
};

export const logout = () => {
  if (!isClient()) return;
  try { localStorage.removeItem(SESSION_KEY); } catch {}
  notifyChange();
};

export const currentUser = (): Account | null => {
  const session = safeRead<{ id?: string }>(SESSION_KEY, {});
  return session.id ? getAccount(session.id) : null;
};

export const updateProfile = (patch: Partial<Pick<Account, 'displayName'>>): Account | null => {
  const me = currentUser();
  if (!me) return null;
  const accounts = listAccounts();
  const idx = accounts.findIndex((a) => a.id === me.id);
  if (idx === -1) return null;
  accounts[idx] = { ...accounts[idx], ...patch };
  safeWrite(ACCOUNTS_KEY, accounts);
  notifyChange();
  return accounts[idx];
};

// Subscribe to login/logout/profile-update events.
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

if (isClient()) {
  // Cross-tab sync: respond to storage events from other tabs.
  window.addEventListener('storage', (e) => {
    if (e.key === SESSION_KEY || e.key === ACCOUNTS_KEY) notifyChange();
  });
}
