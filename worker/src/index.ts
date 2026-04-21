// IHHS AI tutor Worker.
// POST /tutor -> SSE stream from Cloudflare Workers AI (Llama 3.1 8B).
// Body: { messages: [{role, content}], guideTitle?, guideContext? }
// Per-IP rate limit handled in-process via checkRate().

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Env {
  AI: {
    run: (model: string, input: unknown) => Promise<ReadableStream | { response: string }>;
  };
  ALLOWED_ORIGINS: string;
  MODEL: string;
}

// Best-effort in-memory rate limit. Persists only within a single Worker
// isolate, which is fine for casual abuse. Swap for the Cloudflare
// ratelimit binding later when we verify the right wrangler syntax.
const hits = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const checkRate = (key: string): boolean => {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
};

const VERCEL_PREVIEW_RE = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

const isAllowed = (origin: string, list: string): boolean => {
  if (!origin) return false;
  if (VERCEL_PREVIEW_RE.test(origin)) return true;
  const allowed = list.split(',').map((s) => s.trim()).filter(Boolean);
  return allowed.includes('*') || allowed.includes(origin);
};

const SYSTEM_PROMPT =
  'You are the IHHS Study Guide tutor for high school students. ' +
  'Keep replies under 180 words. Explain concepts clearly, ask a guiding question when the student seems stuck, and never just hand over quiz answers, nudge them toward the reasoning. ' +
  'Do not use em dashes; use commas, periods, or "and" instead. ' +
  'If the student asks something outside academic help, politely redirect.';

const corsHeaders = (origin: string, list: string) => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (isAllowed(origin, list)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
};

const json = (data: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS ?? '*');

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/tutor' || request.method !== 'POST') {
      return json({ error: 'Not found' }, 404, cors);
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (!checkRate(ip)) {
      return json({ error: 'Too many requests, try again in a minute.' }, 429, cors);
    }

    let body: { messages?: ChatMessage[]; guideTitle?: string; guideContext?: string };
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, cors);
    }

    const raw = Array.isArray(body.messages) ? body.messages : [];
    const trimmed = raw
      .slice(-10)
      .filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.length > 0 &&
          m.content.length < 4000,
      );
    if (trimmed.length === 0) {
      return json({ error: 'No messages' }, 400, cors);
    }

    const parts = [SYSTEM_PROMPT];
    if (body.guideTitle) {
      parts.push(`The student is currently reading: "${String(body.guideTitle).slice(0, 120)}".`);
    }
    if (body.guideContext) {
      const ctx = String(body.guideContext).slice(0, 3500);
      parts.push(`Here is the guide they are looking at. Ground every answer in this text:\n\n${ctx}`);
    }
    const system = parts.join('\n\n');

    const result = await env.AI.run(env.MODEL ?? '@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'system', content: system }, ...trimmed],
      stream: true,
      max_tokens: 512,
    });

    if (!(result instanceof ReadableStream)) {
      return json({ error: 'Model did not stream' }, 502, cors);
    }

    return new Response(result, {
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
};
