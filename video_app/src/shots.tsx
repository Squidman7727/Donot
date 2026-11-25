import React from "react";
import { Cue, Dropout, ShotBase, WordsFile } from "./kit";
import { RenderStyle5Scene, RenderStyle5Overlay, SceneSpec } from "./Style5Scenes";
import storyboardRaw from "./data/storyboard.json";
import wordsRaw from "./data/words.json";

export type Ctx = { t: number; local: number; p: number; len: number };
export type Shot = ShotBase & { draw: (c: Ctx) => React.ReactNode; overlay?: (c: Ctx) => React.ReactNode };

const W = wordsRaw as WordsFile;
const SB = storyboardRaw as {
  channel?: string;
  day?: string;
  file_num?: string;
  keywords?: string[];
  scenes: SceneSpec[];
};

export const KEYWORDS: string[] = SB.keywords ?? [
  "ISN'T",
  "NEVER",
  "DON'T",
  "SEVEN",
  "DARK",
  "WRONG",
  "REAL",
  "KEEP",
];

function wordTime(idx: number): number {
  if (!W.words || W.words.length === 0) return idx * 0.35;
  if (idx <= 0) return 0;
  const clamped = Math.min(idx, W.words.length - 1);
  const item: any = W.words[clamped];
  return Array.isArray(item) ? item[0] : (item.start ?? 0);
}

const timedScenes = SB.scenes.map((sc, i) => ({
  spec: sc,
  // Prefer exact phrase-locked `start_sec` computed by build_audio.py
  t: i === 0 ? 0 : (typeof sc.start_sec === "number" ? sc.start_sec : wordTime(sc.word_start)),
}));

export const SHOTS: Shot[] = timedScenes.map(({ spec, t }) => ({
  t,
  id: spec.id,
  draw: (ctx) => <RenderStyle5Scene spec={spec} local={ctx.local} p={ctx.p} len={ctx.len} />,
  overlay: (ctx) => <RenderStyle5Overlay spec={spec} local={ctx.local} p={ctx.p} len={ctx.len} />,
}));

export const hudAt = (t: number) => {
  let cur = timedScenes[0].spec;
  for (const item of timedScenes) {
    if (item.t <= t) cur = item.spec;
    else break;
  }
  const ch = (SB.channel || "NIGHTORA").toUpperCase();
  const day = (SB.day || "TUESDAY").toUpperCase();
  const r = cur.rule_num ?? 0;
  return {
    left: `${ch}   ·   ${day}${r > 0 ? `   ·   RULE ${r}` : ""}`,
    rec: true,
    danger: !!cur.danger,
    hideCaption: false,
    timer: null as null | { remaining: number; total: number },
  };
};

const SFX_MAP: Record<string, string> = {
  buzz: "sfx_buzz.wav",
  click: "sfx_click.wav",
  sting: "sfx_sting.wav",
  beep: "sfx_beep.wav",
  tick: "sfx_tick.wav",
  creak: "sfx_creak.wav",
  thud: "sfx_thud.wav",
};

export const CUES: Cue[] = timedScenes
  .filter((x) => x.spec.sfx && SFX_MAP[x.spec.sfx])
  .map((x) => ({ at: x.t, file: SFX_MAP[x.spec.sfx!], vol: 0.48 }));

export const DROPOUTS: Dropout[] = [];
