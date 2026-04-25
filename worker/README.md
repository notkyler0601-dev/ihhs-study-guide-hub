# ihhs-ai-tutor (Cloudflare Worker)

Tiny Cloudflare Worker that proxies student questions to Workers AI
(Google Gemma 4 26B A4B by default) and streams the reply back as SSE.

## Why a Worker and not a Vercel function

Workers AI runs the model on Cloudflare's edge network with no cold
start. No keys to rotate, no per-token billing on our side. Free-tier
quota varies by model, see
https://developers.cloudflare.com/workers-ai/platform/pricing/ for the
current limits on Gemma 4 26B.

## Deploy

```
cd worker
npm install
npx wrangler login             # one time
npx wrangler deploy
```

Wrangler prints the Worker URL, something like
`https://ihhs-ai-tutor.<your-account>.workers.dev`. Copy it.

On the main site, set:

```
PUBLIC_AI_TUTOR_URL=https://ihhs-ai-tutor.<your-account>.workers.dev
```

in Vercel (Project Settings -> Environment Variables), then redeploy.

## Local dev

```
npx wrangler dev
```

Exposes `http://localhost:8787/tutor`. Point the site at it by setting
`PUBLIC_AI_TUTOR_URL=http://localhost:8787` in `.env`.

## Rate limit

Hardcoded to 20 requests per IP per 60 seconds via the native
`ratelimit` binding in `wrangler.toml`. Tweak the `simple` block to
change it.

## CORS

`ALLOWED_ORIGIN` in `wrangler.toml` is set to `https://ihsgh.org`.
Change it or add staging origins as needed.

## Swap the model

Set `MODEL` in `wrangler.toml` to any Workers AI chat model id. Cheap
fallback: `@cf/meta/llama-3.1-8b-instruct`. Higher quality alternatives:
`@cf/meta/llama-3.3-70b-instruct-fp8-fast` or `@cf/openai/gpt-oss-120b`.
The current default `@cf/google/gemma-4-26b-a4b-it` is an MoE with 26B
total / 4B active parameters, 256K context window, and tool-calling
support.
