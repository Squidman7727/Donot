// Timing helpers shared by every style.
// words.json format (from code/audio/transcribe.py or retime.py):
//   { "duration": 312.4, "words": [[start, end, "word"], ...] }
import { interpolate, Easing } from "remotion";

export type Word = [number, number, string];
export type WordsFile = { duration: number; words: Word[] };
export type Phrase = { s: number; e: number; text: string; words: Word[] };

export const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
export const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
export const easeIO = Easing.bezier(0.4, 0, 0.3, 1);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Split words into caption phrases: break on sentence/comma punctuation or after maxWords. */
export const toPhrases = (words: Word[], maxWords = 7): Phrase[] => {
  const out: Phrase[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    out.push({ s: cur[0][0], e: cur[cur.length - 1][1], text: cur.map((w) => w[2].trim()).join(" "), words: cur });
    cur = [];
  };
  for (const w of words) {
    cur.push(w);
    const t = w[2].trim();
    if (/[.?!…]$/.test(t) || (/[,;:—]$/.test(t) && cur.length >= 3) || cur.length >= maxWords) flush();
  }
  flush();
  return out;
};

/** The phrase on screen at time t (held until the next phrase starts, max `hold` s after it ends). */
export const phraseAt = (phrases: Phrase[], t: number, hold = 0.6): Phrase | null => {
  for (let i = phrases.length - 1; i >= 0; i--) {
    const p = phrases[i];
    if (t >= p.s - 0.05) {
      const next = phrases[i + 1];
      const end = next ? Math.min(next.s - 0.05, p.e + hold) : p.e + hold;
      return t <= end ? p : null;
    }
  }
  return null;
};

/** First time a word (case-insensitive, punctuation ignored) is spoken at or after `after` seconds. */
export const wordTime = (words: Word[], word: string, after = 0): number => {
  const k = word.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
  const w = words.find((x) => x[0] >= after && x[2].toLowerCase().replace(/[^\p{L}\p{N}']/gu, "") === k);
  if (!w) throw new Error(`word "${word}" not found after ${after}s`);
  return w[0];
};

/** Sequence of shots keyed by start time; returns the active shot and its local progress. */
export type ShotBase = { t: number; id: string };
export const shotAt = <S extends ShotBase>(shots: S[], t: number, total: number) => {
  let i = 0;
  for (let k = 0; k < shots.length; k++) if (t >= shots[k].t) i = k;
  const s = shots[i];
  const end = shots[i + 1]?.t ?? total;
  return { shot: s, index: i, local: t - s.t, p: Math.min(1, Math.max(0, (t - s.t) / (end - s.t))), len: end - s.t };
};

/** Validates that no shot is longer than maxLen seconds (the 5–6 s pacing rule). */
export const checkPacing = <S extends ShotBase>(shots: S[], total: number, maxLen = 6) =>
  shots
    .map((s, i) => ({ id: s.id, len: (shots[i + 1]?.t ?? total) - s.t }))
    .filter((x) => x.len > maxLen);
