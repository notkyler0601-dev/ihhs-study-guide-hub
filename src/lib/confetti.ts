// Lazy-loaded confetti helper. Used by <Confetti /> and by Quiz / Flashcards
// when the user hits a perfect score or finishes a deck.

import { loadScript, waitForGlobal } from './loadScript';

let confettiFn: ((opts?: any) => void) | null = null;

const ensure = async () => {
  if (confettiFn) return confettiFn;
  await loadScript('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js');
  const lib: any = await waitForGlobal('confetti');
  confettiFn = lib;
  return confettiFn;
};

export const fireConfetti = async (preset: 'burst' | 'cannons' | 'fireworks' = 'burst') => {
  const c = await ensure();
  if (!c) return;
  if (preset === 'cannons') {
    const end = Date.now() + 600;
    (function frame() {
      c({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#b91c1c', '#ffffff', '#27272a'] });
      c({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#b91c1c', '#ffffff', '#27272a'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  } else if (preset === 'fireworks') {
    const duration = 1500;
    const end = Date.now() + duration;
    const interval = setInterval(() => {
      if (Date.now() > end) { clearInterval(interval); return; }
      c({ particleCount: 40, startVelocity: 30, spread: 360, origin: { x: Math.random(), y: Math.random() - 0.2 }, colors: ['#b91c1c', '#dc2626', '#ffffff'] });
    }, 250);
  } else {
    c({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#b91c1c', '#dc2626', '#ffffff', '#27272a'] });
  }
};
