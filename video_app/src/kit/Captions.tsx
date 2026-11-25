import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Word, toPhrases, phraseAt } from "./timing";

/*
 * Caption styles used by the reference channels. Sizes are given at 720p and scale with the video height.
 * Load the fonts once in the style's Video.tsx:
 *   import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat"; montserrat("normal", { weights: ["600","700","800"] });
 *   import { loadFont as poppins } from "@remotion/google-fonts/Poppins";       poppins("normal", { weights: ["700","800"] });
 */

const useT = () => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  return { t: frame / fps, k: height / 720 };
};

const box = (bottomPct: number): React.CSSProperties => ({
  position: "absolute",
  left: "8%",
  right: "8%",
  bottom: `${bottomPct}%`,
  textAlign: "center",
  textTransform: "uppercase",
});

/** Style 1 / Style 5: Montserrat ExtraBold caps, white, no box, ~22px@720, centred at ~85% height. */
export const CapsCaption: React.FC<{ words: Word[]; size?: number; bottom?: number; weight?: number; maxWords?: number }> = ({
  words,
  size = 22,
  bottom = 11,
  weight = 800,
  maxWords = 7,
}) => {
  const { t, k } = useT();
  const phrases = useMemo(() => toPhrases(words, maxWords), [words, maxWords]);
  const p = phraseAt(phrases, t);
  if (!p) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          ...box(bottom),
          fontFamily: "Montserrat",
          fontWeight: weight,
          fontSize: size * k,
          lineHeight: 1.1,
          color: "#F4F4F1",
          letterSpacing: 0.5 * k,
          textShadow: `0 0 ${6 * k}px rgba(255,255,255,0.25)`,
        }}
      >
        {p.text}
      </div>
    </AbsoluteFill>
  );
};

/** Style 3: small Montserrat SemiBold caps with a soft dark shadow, ~13px@720, at ~92% height, one line. */
export const SmallCaption: React.FC<{ words: Word[] }> = ({ words }) => {
  const { t, k } = useT();
  const phrases = useMemo(() => toPhrases(words, 9), [words]);
  const p = phraseAt(phrases, t);
  if (!p) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          ...box(5.5),
          fontFamily: "Montserrat",
          fontWeight: 600,
          fontSize: 13 * k,
          color: "#fff",
          textShadow: `0 ${1 * k}px ${3 * k}px rgba(0,0,0,0.85)`,
          whiteSpace: "nowrap",
        }}
      >
        {p.text}
      </div>
    </AbsoluteFill>
  );
};

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");

/**
 * Style 4 (and the Nightora variant of Style 5): word-by-word karaoke build.
 * Spoken words white, upcoming dim grey, keywords flash red. Poppins ExtraBold caps ~27px@720 at ~93% height.
 */
export const Karaoke: React.FC<{ words: Word[]; keywords?: string[]; red?: string; font?: string; size?: number }> = ({
  words,
  keywords = [],
  red = "#E23A3A",
  font = "Poppins",
  size = 27,
}) => {
  const { t, k } = useT();
  const phrases = useMemo(() => toPhrases(words, 6), [words]);
  const keys = useMemo(() => new Set(keywords.map(norm)), [keywords]);
  const p = phraseAt(phrases, t, 0.4);
  if (!p) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          ...box(5),
          fontFamily: font,
          fontWeight: 800,
          fontSize: size * k,
          textShadow: `0 ${2 * k}px ${6 * k}px rgba(0,0,0,0.8)`,
        }}
      >
        {p.words.map((w, i) => {
          const spoken = t >= w[0] - 0.02;
          const isKey = keys.has(norm(w[2]));
          const color = !spoken ? "rgba(255,255,255,0.32)" : isKey ? red : "#fff";
          return (
            <span key={i} style={{ color, marginRight: 0.28 * size * k }}>
              {w[2].trim()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Style 6: white heavy caps with keywords coloured by meaning (red danger, cyan clue/object, yellow alive/warning). */
export const KeywordCaption: React.FC<{
  words: Word[];
  danger?: string[];
  clue?: string[];
  alive?: string[];
  size?: number;
}> = ({ words, danger = [], clue = [], alive = [], size = 24 }) => {
  const { t, k } = useT();
  const phrases = useMemo(() => toPhrases(words, 7), [words]);
  const sets = useMemo(
    () => ({ d: new Set(danger.map(norm)), c: new Set(clue.map(norm)), a: new Set(alive.map(norm)) }),
    [danger, clue, alive],
  );
  const p = phraseAt(phrases, t);
  if (!p) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          ...box(6),
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize: size * k,
          color: "#fff",
          textShadow: `0 ${2 * k}px ${5 * k}px rgba(0,0,0,0.8)`,
        }}
      >
        {p.words.map((w, i) => {
          const n = norm(w[2]);
          const color = sets.d.has(n) ? "#FF3B3B" : sets.c.has(n) ? "#5FE3F0" : sets.a.has(n) ? "#FFC83D" : "#fff";
          return (
            <span key={i} style={{ color, marginRight: 0.28 * size * k }}>
              {w[2].trim()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
