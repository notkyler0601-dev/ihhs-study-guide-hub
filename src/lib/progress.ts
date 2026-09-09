// Per-guide progress tracking + quiz history.

import { userRead, userWrite } from './storage';

export interface GuideProgress {
  slug: string;
  title: string;
  subject: string;
  firstOpened: string;     // ISO timestamp
  lastOpened: string;
  visits: number;
  sectionsRead: string[];  // header slugs marked complete
  quizScore: { correct: number; total: number; takenAt: string } | null;
  activeSeconds: number;   // active time on the guide across visits, see guideTime.ts
}

export interface QuizResult {
  slug: string;
  title: string;
  correct: number;
  total: number;
  takenAt: string;
}

const PROGRESS_KEY = 'progress:guides';
const QUIZ_HISTORY_KEY = 'progress:quizzes';

export const loadAllProgress = (): Record<string, GuideProgress> => {
  const all = userRead<Record<string, GuideProgress>>(PROGRESS_KEY, {});
  // Records written before time tracking existed have no activeSeconds.
  for (const p of Object.values(all)) {
    if (typeof p.activeSeconds !== 'number' || !Number.isFinite(p.activeSeconds)) p.activeSeconds = 0;
  }
  return all;
};

export const getProgress = (slug: string): GuideProgress | null => loadAllProgress()[slug] ?? null;

const writeProgress = (all: Record<string, GuideProgress>) => userWrite(PROGRESS_KEY, all);

export const trackGuideOpen = (slug: string, title: string, subject: string) => {
  const all = loadAllProgress();
  const now = new Date().toISOString();
  if (all[slug]) {
    all[slug].lastOpened = now;
    all[slug].visits += 1;
  } else {
    all[slug] = {
      slug, title, subject,
      firstOpened: now,
      lastOpened: now,
      visits: 1,
      sectionsRead: [],
      quizScore: null,
      activeSeconds: 0,
    };
  }
  writeProgress(all);
};

// Add active seconds measured by guideTime.ts. Creates the record if the
// guide was never tracked as opened (the tracker can outlive that call).
export const addGuideTime = (slug: string, title: string, subject: string, seconds: number) => {
  const secs = Math.round(seconds);
  if (secs <= 0) return;
  const all = loadAllProgress();
  const now = new Date().toISOString();
  if (!all[slug]) {
    all[slug] = {
      slug, title, subject,
      firstOpened: now,
      lastOpened: now,
      visits: 1,
      sectionsRead: [],
      quizScore: null,
      activeSeconds: 0,
    };
  }
  all[slug].activeSeconds += secs;
  writeProgress(all);
};

// Raise a guide's total to a value learned from the cloud (other devices).
// Never lowers it. Returns whether anything changed.
export const setGuideTimeAtLeast = (slug: string, seconds: number): boolean => {
  const all = loadAllProgress();
  const p = all[slug];
  const secs = Math.round(seconds);
  if (!p || !(secs > p.activeSeconds)) return false;
  p.activeSeconds = secs;
  writeProgress(all);
  return true;
};

export const toggleSectionRead = (slug: string, sectionSlug: string): boolean => {
  const all = loadAllProgress();
  const p = all[slug];
  if (!p) return false;
  const idx = p.sectionsRead.indexOf(sectionSlug);
  if (idx >= 0) p.sectionsRead.splice(idx, 1);
  else p.sectionsRead.push(sectionSlug);
  writeProgress(all);
  return idx < 0;
};

export const recordQuiz = (slug: string, title: string, correct: number, total: number) => {
  const all = loadAllProgress();
  const takenAt = new Date().toISOString();
  if (all[slug]) {
    // Keep the best score.
    const prev = all[slug].quizScore;
    if (!prev || correct / total > prev.correct / prev.total) {
      all[slug].quizScore = { correct, total, takenAt };
    }
    writeProgress(all);
  }
  const history = loadQuizHistory();
  history.push({ slug, title, correct, total, takenAt });
  if (history.length > 500) history.splice(0, history.length - 500);
  userWrite(QUIZ_HISTORY_KEY, history);
};

export const loadQuizHistory = (): QuizResult[] => userRead<QuizResult[]>(QUIZ_HISTORY_KEY, []);

export interface ProgressStats {
  guidesStarted: number;
  guidesCompleted: number;     // sectionsRead count >= some threshold or all sections
  quizzesTaken: number;
  averageScore: number;        // 0-100
  totalActiveSeconds: number;  // active reading time across every guide
  recentGuides: GuideProgress[];
}

export const computeStats = (totalSectionsBySlug: Record<string, number> = {}): ProgressStats => {
  const all = loadAllProgress();
  const guides = Object.values(all);
  const history = loadQuizHistory();
  const guidesCompleted = guides.filter((g) => {
    const total = totalSectionsBySlug[g.slug];
    if (!total) return false;
    return g.sectionsRead.length >= Math.max(1, Math.floor(total * 0.8));
  }).length;
  const quizzesTaken = history.length;
  const averageScore = quizzesTaken === 0 ? 0
    : Math.round((history.reduce((s, q) => s + (q.correct / q.total) * 100, 0) / quizzesTaken));
  return {
    guidesStarted: guides.length,
    guidesCompleted,
    quizzesTaken,
    averageScore,
    totalActiveSeconds: guides.reduce((s, g) => s + g.activeSeconds, 0),
    recentGuides: guides.sort((a, b) => (a.lastOpened < b.lastOpened ? 1 : -1)).slice(0, 5),
  };
};
