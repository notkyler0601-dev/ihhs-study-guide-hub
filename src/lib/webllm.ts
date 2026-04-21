// WebLLM engine wrapper.
//
// Loads a quantized LLM (Llama 3.2, Qwen 2.5, Phi 3.5, etc.) directly in the
// student's browser via WebGPU. Models are downloaded once, cached in
// IndexedDB / OPFS by WebLLM, then run fully offline. Zero API calls, zero
// cost, zero data sent anywhere. Privacy is the entire point.
//
// Used by: <AITutor>, <AIQuizGen>, <AIExplain>.
//
// Usage:
//   import { loadEngine, MODELS, isWebGPUSupported } from '../lib/webllm';
//   const engine = await loadEngine(MODELS[0].id, (msg, pct) => ...);
//   const stream = await engine.chat.completions.create({
//     messages: [{ role: 'user', content: 'Hi' }],
//     stream: true,
//   });
//   for await (const chunk of stream) {
//     const delta = chunk.choices[0]?.delta?.content ?? '';
//     // append delta to UI
//   }
//
// The engine is a singleton per-tab. Switching models unloads the previous
// one to free GPU memory before loading the new one.

import type { MLCEngineInterface, InitProgressReport } from '@mlc-ai/web-llm';

export interface ModelOption {
  id: string;
  label: string;
  size: string;
  description: string;
  default?: boolean;
}

// Curated model registry. Quantized to q4f32_1 for best CPU/GPU balance.
// Sizes are approximate first-download size (cached after).
export const MODELS: ModelOption[] = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    label: 'Llama 3.2 1B',
    size: '~700 MB',
    description: 'Fastest. Great for quick Q&A and short explanations.',
    default: true,
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
    label: 'Qwen 2.5 1.5B',
    size: '~1.0 GB',
    description: 'Strong on math, science, and code reasoning.',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
    label: 'Llama 3.2 3B',
    size: '~2.0 GB',
    description: 'Balanced. Better at long-form study help.',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f32_1-MLC',
    label: 'Phi 3.5 mini (3.8B)',
    size: '~2.4 GB',
    description: 'Microsoft research. Excellent for academic content.',
  },
  {
    id: 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',
    label: 'Hermes 3 (Llama 3.2 3B)',
    size: '~2.0 GB',
    description: 'Conversational tutor persona, great at follow-ups.',
  },
];

export const getDefaultModel = (): ModelOption =>
  MODELS.find((m) => m.default) ?? MODELS[0];

export const isWebGPUSupported = (): boolean =>
  typeof navigator !== 'undefined' && 'gpu' in navigator;

export type ProgressCallback = (text: string, progress: number) => void;

let enginePromise: Promise<MLCEngineInterface> | null = null;
let currentModelId: string | null = null;
let currentProgressCallbacks = new Set<ProgressCallback>();

/**
 * Load (or get) the singleton MLCEngine for the given model.
 * Switches model if requested model differs from currently loaded one.
 */
export async function loadEngine(
  modelId: string,
  onProgress?: ProgressCallback
): Promise<MLCEngineInterface> {
  if (!isWebGPUSupported()) {
    throw new Error('WebGPU is not supported in this browser. Try Chrome, Edge, or Arc.');
  }

  // Same model already loading or loaded → reuse.
  if (currentModelId === modelId && enginePromise) {
    if (onProgress) {
      currentProgressCallbacks.add(onProgress);
      // Replay 100% progress in case the engine is already loaded.
      const eng = await enginePromise;
      onProgress('Ready.', 1);
      currentProgressCallbacks.delete(onProgress);
      return eng;
    }
    return enginePromise;
  }

  // Switching models → unload previous to free GPU memory.
  if (enginePromise && currentModelId !== modelId) {
    try {
      const prev = await enginePromise;
      // unload may not exist on older API; ignore failures.
      await (prev as MLCEngineInterface & { unload?: () => Promise<void> }).unload?.();
    } catch (e) {
      console.warn('[webllm] failed to unload previous engine', e);
    }
    enginePromise = null;
    currentProgressCallbacks.clear();
  }

  currentModelId = modelId;
  if (onProgress) currentProgressCallbacks.add(onProgress);

  // Lazy-import the heavy SDK only when actually needed.
  enginePromise = (async () => {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
    return CreateMLCEngine(modelId, {
      initProgressCallback: (report: InitProgressReport) => {
        const text = report.text || 'Loading model...';
        const pct = report.progress ?? 0;
        currentProgressCallbacks.forEach((cb) => {
          try { cb(text, pct); } catch (e) { console.warn(e); }
        });
      },
    });
  })();

  return enginePromise;
}

/** Currently loaded model id, or null if no engine has been requested. */
export function getCurrentModel(): string | null {
  return currentModelId;
}

/** Returns the engine if already created; null otherwise. Does NOT trigger a load. */
export function getEngineIfLoaded(): Promise<MLCEngineInterface> | null {
  return enginePromise;
}

/**
 * Stream a chat completion. Yields {delta, full} on each token chunk.
 * Pass an AbortController.signal to interrupt generation early.
 */
export async function* streamChat(
  engine: MLCEngineInterface,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal } = {}
): AsyncGenerator<{ delta: string; full: string }, void, void> {
  const stream = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024,
  });

  let full = '';
  for await (const chunk of stream) {
    if (opts.signal?.aborted) {
      // Try to interrupt the engine cleanly.
      try { await (engine as MLCEngineInterface & { interruptGenerate?: () => void }).interruptGenerate?.(); }
      catch (e) { console.warn('[webllm] failed to interrupt', e); }
      return;
    }
    const delta = chunk.choices?.[0]?.delta?.content ?? '';
    if (!delta) continue;
    full += delta;
    yield { delta, full };
  }
}

/** One-shot completion (collects the full stream into one string). */
export async function completeOnce(
  engine: MLCEngineInterface,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal } = {}
): Promise<string> {
  let final = '';
  for await (const { full } of streamChat(engine, messages, opts)) {
    final = full;
  }
  return final;
}

/** Roughly-token character budget. ~4 chars per token is a safe estimate. */
export const charBudgetForTokens = (tokens: number): number => tokens * 4;

/**
 * Pull plain text out of the current guide's prose container, capped to
 * a token budget so we don't blow past context limits.
 */
export function getGuideContext(maxChars = 8000): string {
  if (typeof document === 'undefined') return '';
  const article = document.querySelector('article') ?? document.querySelector('main');
  if (!article) return '';
  // Prefer the prose body but fall back to whole article.
  const prose = article.querySelector('.prose') ?? article;
  const raw = (prose.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (raw.length <= maxChars) return raw;
  // Front + middle + back excerpt for better context coverage.
  const third = Math.floor(maxChars / 3);
  return [
    raw.slice(0, third),
    '\n\n[...]\n\n',
    raw.slice(Math.floor(raw.length / 2) - third / 2, Math.floor(raw.length / 2) + third / 2),
    '\n\n[...]\n\n',
    raw.slice(-third),
  ].join('');
}

/**
 * Persist + retrieve the user's preferred model id so the picker is sticky.
 */
const PREF_KEY = 'webllm:preferred-model';
export function getPreferredModelId(): string {
  if (typeof localStorage === 'undefined') return getDefaultModel().id;
  return localStorage.getItem(PREF_KEY) ?? getDefaultModel().id;
}
export function setPreferredModelId(id: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PREF_KEY, id);
}
