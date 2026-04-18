// Lazy-load external CDN scripts and stylesheets, with deduping.
// Used by every Tier 3 interactive component so that guides which
// don't import them stay light.

const scriptPromises = new Map<string, Promise<void>>();
const styleLoaded = new Set<string>();

export function loadScript(url: string, opts: { module?: boolean } = {}): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  const existing = scriptPromises.get(url);
  if (existing) return existing;

  const p = new Promise<void>((resolve, reject) => {
    // Check if a matching <script> already exists in the DOM (server-rendered or otherwise).
    const present = document.querySelector(`script[src="${url}"]`);
    if (present) { resolve(); return; }

    const s = document.createElement('script');
    s.src = url;
    if (opts.module) s.type = 'module';
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(s);
  });

  scriptPromises.set(url, p);
  return p;
}

export function loadStyle(url: string): void {
  if (typeof document === 'undefined') return;
  if (styleLoaded.has(url)) return;
  if (document.querySelector(`link[href="${url}"]`)) { styleLoaded.add(url); return; }

  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = url;
  document.head.appendChild(l);
  styleLoaded.add(url);
}

// Wait for a global to appear on window (some libs attach themselves async).
export function waitForGlobal<T = unknown>(name: string, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const v = (window as any)[name];
      if (v !== undefined) { resolve(v as T); return; }
      if (Date.now() - start > timeoutMs) { reject(new Error(`Timed out waiting for window.${name}`)); return; }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

// Quick helper: load a script and return the named global once it's available.
export async function importGlobal<T = unknown>(url: string, globalName: string, opts: { module?: boolean } = {}): Promise<T> {
  await loadScript(url, opts);
  return waitForGlobal<T>(globalName);
}
