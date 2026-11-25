import React from "react";
import { Audio, Sequence, staticFile, interpolate, useVideoConfig } from "remotion";
import { clamp } from "./timing";

/*
 * The whole mix in one place.
 * - The voiceover is never processed here except volume (it is the user's file).
 * - The music/drone bed never drops to silence, except on purpose at `dropouts` (the key line).
 * - SFX are story-motivated cues, not one per cut.
 * Levels are linear gains. Start points per style (then check with code/audio/mixcheck.py):
 *   S1 bed 0.10–0.14 · S2 bed 0.18–0.25 · S3 bed 0.14–0.2 (Pictofear-type 0.25) · S4 bed 0.12–0.14 · S5 bed 0.1–0.14 · S6 bed 0.12–0.16
 */

export type Cue = { file: string; at: number; vol?: number; len?: number; trimBefore?: number; fadeOut?: number };
export type Dropout = { at: number; len: number; depth?: number }; // bed dips to `depth` (default 0.15×) for len seconds

export const Soundtrack: React.FC<{
  vo: string;
  voVol?: number;
  bed?: string;
  bedVol?: number;
  bedLoop?: boolean;
  dropouts?: Dropout[];
  cues?: Cue[];
  total: number; // seconds
  fadeIn?: number;
  fadeOut?: number;
}> = ({ vo, voVol = 1, bed, bedVol = 0.12, bedLoop = true, dropouts = [], cues = [], total, fadeIn = 0.8, fadeOut = 2.5 }) => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const bedGain = (frame: number) => {
    const t = frame / fps;
    let g = bedVol * interpolate(t, [0, fadeIn, total - fadeOut, total], [0, 1, 1, 0], clamp);
    for (const d of dropouts) {
      const depth = d.depth ?? 0.15;
      const k = interpolate(t, [d.at - 0.25, d.at, d.at + d.len, d.at + d.len + 0.6], [1, depth, depth, 1], clamp);
      g *= k;
    }
    return g;
  };
  return (
    <>
      <Audio src={staticFile(vo)} volume={voVol} />
      {bed && <Audio src={staticFile(bed)} volume={bedGain} loop={bedLoop} />}
      {cues.map((c, i) => (
        <Sequence key={i} from={f(c.at)} durationInFrames={f(c.len ?? 3)}>
          <Audio
            src={staticFile(c.file)}
            trimBefore={c.trimBefore ? f(c.trimBefore) : undefined}
            volume={(fr) => (c.vol ?? 0.5) * (c.fadeOut ? interpolate(fr, [f((c.len ?? 3) - c.fadeOut), f(c.len ?? 3)], [1, 0], clamp) : 1)}
          />
        </Sequence>
      ))}
    </>
  );
};
