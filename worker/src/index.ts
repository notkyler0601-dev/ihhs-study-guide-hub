// IHHS AI tutor Worker.
// POST /tutor  { messages: [{role, content}], guideTitle? }  -> SSE stream
// Uses Cloudflare Workers AI (Llama 3.1 8B by default) and rate-limits per IP.

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Env {
  AI: {
    run: (model: string, input: unknown) => Promise<ReadableStream | { response: string }>;
  };
  RATE_LIMITER: { limit: (opts: { key: string }) => Promise<{ success: boolean }> };
  ALLOWED_ORIGINS: string;
  MODEL: string;
}

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
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) {
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
