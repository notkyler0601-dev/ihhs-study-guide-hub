// Active-time tracking for guide pages.
//
// What counts: a second counts toward a guide when the tab is visible AND the
// reader has scrolled, moved, typed or tapped within the last IDLE_AFTER_MS,
// or keyboard focus sits inside an embedded iframe (videos, sandboxes) whose
// input never reaches this document. Background tabs, minimized windows and
// walk-aways therefore stop the clock.
//
// Where it goes:
//   1. localStorage through progress.ts (GuideProgress.activeSeconds), so the
//      dashboard and the guide header badge can read it synchronously.
//   2. Supabase `guide_sessions` in cloud mode: one row per page visit,
//      upserted every FLUSH_EVERY_MS of active time, on tab hide, on unload
//      (keepalive fetch) and on client-side navigation. Rows that fail to
//      reach the cloud wait in a device-local queue and are replayed on the
//      next guide open. Admins read the table back on /admin/reading-time and
//      next to claimed volunteer hours. Row-level security keeps everyone
//      else to their own rows.
//
// Only signed-in readers are tracked: there is no user to attach time to
// otherwise, and the site does not accept anonymous writes.

import { currentUser, onAuthChange } from './auth';
import { isCloudMode, supabase } from './supabase';
import { addGuideTime, loadAllProgress, setGuideTimeAtLeast } from './progress';

export const IDLE_AFTER_MS = 90_000;
const TICK_MS = 1_000;
const MAX_TICK_DELTA_MS = 2_000;
const FLUSH_EVERY_MS = 30_000;

export interface SessionRow {
  id: string;
  user_id: string;
  guide_slug: string;
  started_at: string;
  last_seen_at: string;
  active_seconds: number;
}

interface Session {
  id: string;
  userId: string;
  slug: string;
  title: string;
  subject: string;
  startedAt: string;
  activeMs: number;         // engaged milliseconds this visit
  flushedLocalMs: number;   // portion already added to progress.ts
  pushedSeconds: number;    // active_seconds last handed to the cloud
}

export interface GuideTimeDetail {
  slug: string;
  sessionSeconds: number;   // this visit
  totalSeconds: number;     // all visits, local record plus unflushed remainder
}

const isClient = () => typeof window !== 'undefined';

// ------------------------------------------------------------
// State
// ------------------------------------------------------------

let session: Session | null = null;
let lastInputAt = 0;
let lastTickAt = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let installed = false;
let accessToken: string | null = null;

// ------------------------------------------------------------
// Formatting
// ------------------------------------------------------------

export const formatDuration = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  if (s === 0) return '0 min';
  if (s < 60) return '<1 min';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

// Decimal hours, to sit next to the hours a volunteer claimed.
export const formatHours = (seconds: number): string => {
  const h = Math.max(0, seconds) / 3600;
  return `${h < 10 ? h.toFixed(1) : String(Math.round(h))} h`;
};

const newSessionId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {}
  // RFC 4122 v4 fallback for old browsers and non-secure contexts.
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += hex[(Math.random() * 4) | 8];
    else out += hex[(Math.random() * 16) | 0];
  }
  return out;
};

// ------------------------------------------------------------
// Pending-sync queue. Device-local on purpose: it lives outside the
// `ihhs:u:<id>:` namespace so storage.ts never mirrors it to the cloud.
// ------------------------------------------------------------

const pendingKey = (userId: string) => `ihhs:time:pending:${userId}`;

const readPending = (userId: string): Record<string, SessionRow> => {
  if (!isClient()) return {};
  try {
    const raw = localStorage.getItem(pendingKey(userId));
    return raw ? (JSON.parse(raw) as Record<string, SessionRow>) : {};
  } catch {
    return {};
  }
};

const writePending = (userId: string, rows: Record<string, SessionRow>) => {
  if (!isClient()) return;
  try {
    if (Object.keys(rows).length === 0) localStorage.removeItem(pendingKey(userId));
    else localStorage.setItem(pendingKey(userId), JSON.stringify(rows));
  } catch {}
};

const queuePut = (row: SessionRow) => {
  const rows = readPending(row.user_id);
  rows[row.id] = row;
  writePending(row.user_id, rows);
};

// Drop the queued copy once the cloud holds at least this much.
const queueAck = (row: SessionRow) => {
  const rows = readPending(row.user_id);
  const cur = rows[row.id];
  if (cur && cur.active_seconds <= row.active_seconds) {
    delete rows[row.id];
    writePending(row.user_id, rows);
  }
};

// ------------------------------------------------------------
// Cloud writes
// ------------------------------------------------------------

const refreshAccessToken = async () => {
  const sb = supabase();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getSession();
    accessToken = data.session?.access_token ?? null;
  } catch {
    accessToken = null;
  }
};

const pushRow = async (row: SessionRow): Promise<boolean> => {
  const sb = supabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('guide_sessions').upsert(row, { onConflict: 'id' });
    if (error) return false;
    queueAck(row);
    return true;
  } catch {
    return false;
  }
};

// Upsert that survives tab hide and page unload. Plain fetch so we can set
// keepalive, which supabase-js does not expose. Needs a cached access token.
const beaconRow = (row: SessionRow) => {
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anon || !accessToken) return;
  try {
    void fetch(`${url}/rest/v1/guide_sessions?on_conflict=id`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: anon,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
    }).then((res) => { if (res.ok) queueAck(row); }, () => {});
  } catch {}
};

// Replay rows that never reached the cloud (closed tab, offline, expired session).
export const flushPendingSessions = async (): Promise<void> => {
  if (!isClient() || !isCloudMode()) return;
  const me = currentUser();
  if (!me) return;
  const rows = Object.values(readPending(me.id)).filter((r) => r.id !== session?.id);
  for (const row of rows) await pushRow(row);
};

// ------------------------------------------------------------
// Reading aggregates back (admin pages, dashboard refresh)
// ------------------------------------------------------------

export interface ReaderTimeRow {
  user_id: string;
  username: string;
  display_name: string;
  guide_slug: string;
  sessions: number;
  session_seconds: number;      // measured by the tracker
  adjustment_seconds: number;   // admin delta from the hours ledger (all-time view only)
  active_seconds: number;       // effective total: max(0, measured + delta)
  first_seen_at: string | null; // null when only an adjustment exists
  last_seen_at: string | null;
  adjusted_by: string | null;   // username of the admin who last set it
  adjusted_at: string | null;
  adjustment_note: string | null;
}

export type SetTrackedResult = { ok: true; delta: number } | { ok: false; error: string };

// Admin only (row-level security enforces it): make a reader's effective
// tracked time on a guide equal `targetSeconds`. Stored as a delta against
// the measured total, so anything they read afterwards still adds on top.
// A target equal to the measured total removes the adjustment row.
export const setTrackedTime = async (
  target: { user_id: string; guide_slug: string; session_seconds: number },
  targetSeconds: number,
  note: string | null = null,
): Promise<SetTrackedResult> => {
  const sb = supabase();
  if (!sb) return { ok: false, error: 'Supabase is not configured.' };
  const delta = Math.max(0, Math.round(targetSeconds)) - Math.round(Number(target.session_seconds) || 0);
  const key = { user_id: target.user_id, guide_slug: target.guide_slug };
  const { error } = delta === 0
    ? await sb.from('guide_time_adjustments').delete().match(key)
    : await sb.from('guide_time_adjustments').upsert({ ...key, delta_seconds: delta, note }, { onConflict: 'user_id,guide_slug' });
  if (error) return { ok: false, error: error.message };
  return { ok: true, delta };
};

export interface GuideTimeRow {
  guide_slug: string;
  readers: number;
  sessions: number;
  active_seconds: number;
  last_seen_at: string;
}

const PAGE = 1000;

const rpcAll = async <T>(fn: string, since?: Date | null): Promise<T[]> => {
  const sb = supabase();
  if (!sb) return [];
  const args = since ? { since: since.toISOString() } : {};
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.rpc(fn, args).range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
};

// Row-level security scopes both: admins get everyone, anyone else only themselves.
export const fetchTimeByReader = (since?: Date | null) => rpcAll<ReaderTimeRow>('guide_time_by_reader', since);
export const fetchTimeByGuide = (since?: Date | null) => rpcAll<GuideTimeRow>('guide_time_by_guide', since);

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
}

// Every account. Usernames are readable by everyone under the site's RLS, so
// this needs no admin privilege; the admin pages use it to list accounts that
// have no reading time yet.
export const fetchAllProfiles = async (): Promise<ProfileRow[]> => {
  const sb = supabase();
  if (!sb) return [];
  const out: ProfileRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('profiles')
      .select('id, username, display_name, created_at')
      .order('username')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as ProfileRow[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
};

// Pull this reader's cloud totals into the local progress record. Other
// devices write their own visits, so the cloud sum is the cross-device truth;
// local only wins while it holds time that has not synced yet. Resolves to
// whether any local total changed.
export const refreshTimeFromCloud = async (): Promise<boolean> => {
  if (!isClient() || !isCloudMode()) return false;
  const me = currentUser();
  if (!me) return false;
  try {
    await flushPendingSessions();
    const rows = await fetchTimeByReader();
    const totals = new Map<string, number>();
    for (const r of rows) {
      if (r.user_id !== me.id) continue;
      totals.set(r.guide_slug, (totals.get(r.guide_slug) ?? 0) + Number(r.active_seconds));
    }
    let changed = false;
    totals.forEach((secs, slug) => {
      if (setGuideTimeAtLeast(slug, secs)) changed = true;
    });
    if (changed) emit();
    return changed;
  } catch {
    return false;
  }
};

// ------------------------------------------------------------
// Tracker
// ------------------------------------------------------------

const iframeHasFocus = () => {
  const el = document.activeElement;
  return !!el && el.tagName === 'IFRAME';
};

const isEngaged = (now: number) =>
  document.visibilityState === 'visible' && (now - lastInputAt <= IDLE_AFTER_MS || iframeHasFocus());

export const currentGuideTime = (): GuideTimeDetail | null => {
  if (!session) return null;
  const stored = loadAllProgress()[session.slug]?.activeSeconds ?? 0;
  const unflushed = Math.floor((session.activeMs - session.flushedLocalMs) / 1000);
  return {
    slug: session.slug,
    sessionSeconds: Math.floor(session.activeMs / 1000),
    totalSeconds: stored + unflushed,
  };
};

const emit = () => {
  if (!isClient()) return;
  const detail = currentGuideTime();
  if (detail) window.dispatchEvent(new CustomEvent<GuideTimeDetail>('ihhs:guide-time', { detail }));
};

const toRow = (s: Session): SessionRow => ({
  id: s.id,
  user_id: s.userId,
  guide_slug: s.slug,
  started_at: s.startedAt,
  last_seen_at: new Date().toISOString(),
  active_seconds: Math.floor(s.activeMs / 1000),
});

type FlushReason = 'interval' | 'hide' | 'unload' | 'end';

const flush = (reason: FlushReason) => {
  if (!session) return;
  const secs = Math.floor((session.activeMs - session.flushedLocalMs) / 1000);
  if (secs > 0) {
    addGuideTime(session.slug, session.title, session.subject, secs);
    session.flushedLocalMs += secs * 1000;
  }
  if (!isCloudMode()) return;
  const row = toRow(session);
  if (row.active_seconds <= 0 || row.active_seconds === session.pushedSeconds) return;
  session.pushedSeconds = row.active_seconds;
  queuePut(row);
  if (reason === 'unload' || reason === 'hide') {
    beaconRow(row);
  } else {
    void pushRow(row).then((ok) => { if (ok) void refreshAccessToken(); });
  }
};

const tick = () => {
  if (!session) return;
  const now = Date.now();
  const delta = Math.min(Math.max(0, now - lastTickAt), MAX_TICK_DELTA_MS);
  lastTickAt = now;
  if (!isEngaged(now)) return;
  session.activeMs += delta;
  emit();
  if (session.activeMs - session.flushedLocalMs >= FLUSH_EVERY_MS) flush('interval');
};

const endSession = () => {
  if (!session) return;
  tick();
  flush('end');
  session = null;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

const beginSession = (userId: string, slug: string, title: string, subject: string) => {
  const now = Date.now();
  session = {
    id: newSessionId(),
    userId,
    slug,
    title,
    subject,
    startedAt: new Date(now).toISOString(),
    activeMs: 0,
    flushedLocalMs: 0,
    pushedSeconds: 0,
  };
  lastInputAt = now;
  lastTickAt = now;
  timer = setInterval(tick, TICK_MS);
  emit();
  if (isCloudMode()) {
    void refreshAccessToken();
    void refreshTimeFromCloud();
  }
};

// Bind to whatever guide is on the page right now (or to nothing).
const syncToPage = () => {
  if (!isClient()) return;
  const meta = document.querySelector<HTMLElement>('[data-guide-meta]');
  const me = currentUser();
  const slug = meta?.dataset.guideSlug ?? '';
  if (!meta || !slug || !me) {
    endSession();
    return;
  }
  if (session && session.slug === slug && session.userId === me.id) return;
  endSession();
  const title = document.querySelector('[data-guide-title]')?.textContent?.trim() || slug;
  const subject = meta.dataset.guideSubject ?? '';
  beginSession(me.id, slug, title, subject);
};

const onInput = () => {
  lastInputAt = Date.now();
};

const onVisibility = () => {
  if (document.visibilityState === 'hidden') {
    tick();
    flush('hide');
  } else {
    // Coming back to the tab is itself an interaction, and the hidden gap
    // must not be credited on the next tick.
    const now = Date.now();
    lastTickAt = now;
    lastInputAt = now;
  }
};

const install = () => {
  if (installed || !isClient()) return;
  installed = true;
  const opts: AddEventListenerOptions = { passive: true, capture: true };
  ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((type) =>
    window.addEventListener(type, onInput, opts));
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', () => {
    tick();
    flush('unload');
  });
  document.addEventListener('astro:before-swap', () => endSession());
  document.addEventListener('astro:after-swap', () => syncToPage());
  onAuthChange(() => syncToPage());
  // auth.ts re-hydrates every user_data row from the cloud on each load,
  // which can drop local totals back to an older cloud copy of the progress
  // blob. The sessions table is the truth, so fold it back in afterwards.
  window.addEventListener('ihhs:data-hydrated', () => {
    if (session) void refreshTimeFromCloud();
  });
};

// Call from any page that renders a guide (GuideLayout does). Safe to call
// repeatedly: listeners install once, and the tracker rebinds to the guide
// currently on the page.
export const startGuideTracking = () => {
  install();
  syncToPage();
};
