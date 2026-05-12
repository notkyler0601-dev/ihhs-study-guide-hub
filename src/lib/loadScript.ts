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

// Run an init callback for each root only when it scrolls near the viewport.
// Mega-guides like modern-europe import dozens of components that each pull a
// chunk of d3 (50+ submodule round-trips on jsdelivr +esm) or a large lib.
// Without this, every component below the fold fetches its libs on initial
// page load, freezing the main thread for seconds. Wrapping init in a single
// IntersectionObserver lets each component pay its cost only when the user
// actually scrolls toward it.
//
// `selector` is the CSS selector for unmounted roots (e.g. '[data-tm]:not([data-tm-ready])').
// The callback receives the array of roots that just entered the rootMargin.
// The selector is re-queried on `astro:after-swap` so view transitions work.
export function mountWhenVisible(
  selector: string,
  init: (roots: HTMLElement[]) => void | Promise<void>,
  opts: { rootMargin?: string } = {}
): void {
  if (typeof window === 'undefined') return;
  const rootMargin = opts.rootMargin ?? '600px 0px';
  const queue = (): void => {
    const roots = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (roots.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') {
      void init(roots);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible: HTMLElement[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.push(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        }
        if (visible.length > 0) void init(visible);
      },
      { rootMargin }
    );
    roots.forEach((r) => observer.observe(r));
  };
  queue();
  document.addEventListener('astro:after-swap', queue);
}

// Pause an animation handle when the element scrolls fully out of view and
// resume it on re-entry. Wraps the IntersectionObserver pattern that
// Particles.astro already uses. Pass an object with optional play/pause
// methods (matches tsParticles' container API; for other libs you supply
// closures that call into your render loop).
export function pauseWhenOffscreen(
  el: Element,
  handle: { play?: () => void; pause?: () => void },
  opts: { rootMargin?: string; threshold?: number | number[] } = {}
): void {
  if (typeof IntersectionObserver === 'undefined') return;
  const rootMargin = opts.rootMargin ?? '50px 0px';
  const threshold = opts.threshold ?? 0;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          try { handle.play && handle.play(); } catch (_) {}
        } else {
          try { handle.pause && handle.pause(); } catch (_) {}
        }
      }
    },
    { rootMargin, threshold }
  );
  observer.observe(el);
}
