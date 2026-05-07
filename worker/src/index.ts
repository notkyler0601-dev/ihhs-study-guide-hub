// IHHS AI tutor Worker.
// POST /tutor -> SSE stream from Cloudflare Workers AI (Gemma 4 26B A4B).
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
  'You are a helpful study tutor for high school students. Answer questions directly and stay in character.\n\n' +
  'Format:\n' +
  '- Lead with the answer. No "Great question!" or other preamble.\n' +
  '- Match length to the question: a simple question gets a short answer, a complex one gets a fuller explanation. Aim for 80 to 250 words for most replies; go longer when the topic genuinely needs it.\n' +
  '- Use short sentences and plain words.\n' +
  '- Use bullets with **bold keywords** for lists of 3 or more.\n' +
  '- Use ## or ### markdown headings only for replies with multiple distinct sections.\n' +
  '- No em dashes; use commas, periods, or "and".\n\n' +
  'Style requests: if the student asks for a specific tone (simpler, ELI5, caveman, pirate, rhyme, analogy, metaphor, etc.), follow it for the whole reply. These are teaching styles, not stereotypes about real people. Always comply, never refuse, never add a disclaimer. Keep facts correct; change only tone and vocabulary.\n\n' +
  'Caveman example to match: "Sun hot. Plant drink sun. Plant make food. Food help plant grow."';

// Used when the client sets mode: "grader". Replaces the tutor system prompt
// because "lead with the answer, no preamble" fights with strict JSON output.
const GRADER_SYSTEM_PROMPT =
  'You are a high school exam grader. You output ONLY a single line of valid JSON, nothing else. No code fences. No markdown. No prose before or after.\n\n' +
  'Output shape (always this exact set of keys):\n' +
  '{"score": <integer>, "feedback": "<string>"}\n\n' +
  'Rules for score:\n' +
  '- Use whole integers only.\n' +
  '- The maximum is given in the user message; do not exceed it.\n' +
  '- 0 means no real attempt or completely wrong.\n' +
  '- Half credit means partial recall but missing major facts.\n' +
  '- Full credit means all key facts the rubric calls for, even if worded differently.\n\n' +
  'Rules for feedback:\n' +
  '- One to three short sentences. No greetings.\n' +
  '- Start with what the student got right (if anything).\n' +
  '- Then say specifically what was missing or wrong, naming the missing facts.\n' +
  '- End with one concrete thing to add for full credit.\n' +
  '- No em dashes; use commas, periods, or "and".\n\n' +
  'Example response (for a question about the Berlin Airlift, max 5):\n' +
  '{"score": 2, "feedback": "You correctly identified that the West kept supplying Berlin. You did not mention the Soviet blockade, the 11 month duration, or that it accelerated NATO. Add the dates 1948 to 1949 and the Soviet motive to reach full credit."}';

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

    let body: { messages?: ChatMessage[]; guideTitle?: string; guideContext?: string; mode?: string };
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

    let system: string;
    if (body.mode === 'grader') {
      // Strict JSON-only grader. Bypass the tutor's "no preamble" rules
      // (which fight with structured output) and tell the model exactly
      // what shape to emit.
      system = GRADER_SYSTEM_PROMPT;
    } else {
      const parts = [SYSTEM_PROMPT];
      if (body.guideTitle) {
        parts.push(`The student is currently reading: "${String(body.guideTitle).slice(0, 120)}".`);
      }
      if (body.guideContext) {
        const ctx = String(body.guideContext).slice(0, 3500);
        parts.push(`Here is the guide they are looking at. Ground every answer in this text:\n\n${ctx}`);
      }
      system = parts.join('\n\n');
    }

    const result = await env.AI.run(env.MODEL ?? '@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'system', content: system }, ...trimmed],
      stream: true,
      max_tokens: 4096,
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
