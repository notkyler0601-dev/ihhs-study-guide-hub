// Spaced Repetition System using a slightly adapted SM-2 algorithm.
// Each card tracks ease (E-Factor), interval in days, due date, and rep count.
// User answers each review with one of: again | hard | good | easy.

import { userRead, userWrite } from './storage';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface CardState {
  id: string;          // `${guideSlug}::${cardIdx}`
  guideSlug: string;
  cardIdx: number;
  front: string;       // cached so review page can render without loading guide
  back: string;
  ease: number;        // E-Factor, default 2.5
  interval: number;    // days until next review
  due: string;         // ISO date (YYYY-MM-DD)
  reps: number;        // total reviews
  lapses: number;      // times answered 'again'
  lastReviewed: string | null;
  createdAt: string;
}

const DECK_KEY = 'srs:deck';
const REVIEW_HISTORY_KEY = 'srs:history';

const isoDate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDays = (d: Date, days: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
};

export const loadDeck = (): Record<string, CardState> => userRead<Record<string, CardState>>(DECK_KEY, {});

export const saveDeck = (deck: Record<string, CardState>) => userWrite(DECK_KEY, deck);

// Register a card if not yet in the deck. Idempotent.
export const registerCard = (
  guideSlug: string,
  cardIdx: number,
  front: string,
  back: string
): CardState => {
  const id = `${guideSlug}::${cardIdx}`;
  const deck = loadDeck();
  if (deck[id]) {
    // Refresh front/back in case the guide was edited.
    deck[id].front = front;
    deck[id].back = back;
    saveDeck(deck);
    return deck[id];
  }
  const card: CardState = {
    id,
    guideSlug,
    cardIdx,
    front,
    back,
    ease: 2.5,
    interval: 0,
    due: isoDate(), // due immediately on first registration
    reps: 0,
    lapses: 0,
    lastReviewed: null,
    createdAt: new Date().toISOString(),
  };
  deck[id] = card;
  saveDeck(deck);
  return card;
};

// Apply a rating, return the updated card.
export const review = (cardId: string, rating: Rating): CardState | null => {
  const deck = loadDeck();
  const card = deck[cardId];
  if (!card) return null;

  // SM-2 adaptation:
  //   again => reset interval to 0, ease -= 0.20
  //   hard  => interval *= 1.2 (or 1 day if new), ease -= 0.15
  //   good  => use current ease, ease unchanged
  //   easy  => interval *= ease * 1.3, ease += 0.15
  let nextInterval = card.interval;
  let nextEase = card.ease;
  let lapses = card.lapses;

  switch (rating) {
    case 'again':
      nextInterval = 0;
      nextEase = Math.max(1.3, card.ease - 0.2);
      lapses += 1;
      break;
    case 'hard':
      nextInterval = card.interval === 0 ? 1 : Math.max(1, Math.round(card.interval * 1.2));
      nextEase = Math.max(1.3, card.ease - 0.15);
      break;
    case 'good':
      if (card.interval === 0) nextInterval = 1;
      else if (card.interval === 1) nextInterval = 3;
      else nextInterval = Math.round(card.interval * card.ease);
      break;
    case 'easy':
      if (card.interval === 0) nextInterval = 4;
      else nextInterval = Math.round(card.interval * card.ease * 1.3);
      nextEase = card.ease + 0.15;
      break;
  }

  card.interval = nextInterval;
  card.ease = Math.round(nextEase * 100) / 100;
  card.due = isoDate(addDays(new Date(), nextInterval));
  card.reps += 1;
  card.lapses = lapses;
  card.lastReviewed = new Date().toISOString();
  deck[cardId] = card;
  saveDeck(deck);

  // Append to history for streak/dashboard.
  appendHistory({ cardId, rating, on: isoDate() });
  return card;
};

interface HistoryEntry { cardId: string; rating: Rating; on: string }
export const loadHistory = (): HistoryEntry[] => userRead<HistoryEntry[]>(REVIEW_HISTORY_KEY, []);
const appendHistory = (entry: HistoryEntry) => {
  const h = loadHistory();
  h.push(entry);
  // Cap history at last 5000 entries to prevent unbounded growth.
  if (h.length > 5000) h.splice(0, h.length - 5000);
  userWrite(REVIEW_HISTORY_KEY, h);
};

// All cards due today or earlier.
export const dueCards = (deck = loadDeck()): CardState[] => {
  const today = isoDate();
  return Object.values(deck)
    .filter((c) => c.due <= today)
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.reps - b.reps));
};

// Cards "mastered" = reviewed at least once with interval >= 21 days.
export const masteredCount = (deck = loadDeck()): number =>
  Object.values(deck).filter((c) => c.reps > 0 && c.interval >= 21).length;

export const totalCards = (deck = loadDeck()): number => Object.keys(deck).length;

export const reviewedToday = (history = loadHistory()): number => {
  const today = isoDate();
  return history.filter((h) => h.on === today).length;
};

// Consecutive days with at least one review, ending today or yesterday.
export const computeStreak = (history = loadHistory()): number => {
  if (history.length === 0) return 0;
  const days = new Set(history.map((h) => h.on));
  let streak = 0;
  let cursor = new Date();
  // Allow today OR yesterday as start (so the user doesn't lose streak before reviewing today).
  if (!days.has(isoDate(cursor))) {
    cursor = addDays(cursor, -1);
    if (!days.has(isoDate(cursor))) return 0;
  }
  while (days.has(isoDate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

// Reviews per day for the last N days (oldest first), used for activity graph.
export const activityHeatmap = (days = 30, history = loadHistory()): { date: string; count: number }[] => {
  const counts = new Map<string, number>();
  history.forEach((h) => counts.set(h.on, (counts.get(h.on) ?? 0) + 1));
  const out: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = isoDate(addDays(new Date(), -i));
    out.push({ date: d, count: counts.get(d) ?? 0 });
  }
  return out;
};
