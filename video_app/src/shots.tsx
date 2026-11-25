import React from "react";
import { Cue, Dropout, ShotBase, WordsFile } from "./kit";
import { RenderStyle5Scene, RenderStyle5Overlay, SceneSpec } from "./Style5Scenes";
import storyboardRaw from "./data/storyboard.json";
import wordsRaw from "./data/words.json";

export type Ctx = { t: number; local: number; p: number; len: number };
export type Shot = ShotBase & { draw: (c: Ctx) => React.ReactNode; overlay?: (c: Ctx) => React.ReactNode };

const W = wordsRaw as WordsFile;
const SB = storyboardRaw as { channel?: string; file_num?: string; scenes: SceneSpec[] };

function wordTime(idx: number): number {
  if (!W.words || W.words.length === 0) return idx * 0.4;
  if (idx <= 0) return 0;
  const clamped = Math.min(idx, W.words.length - 1);
  const item: any = W.words[clamped];
  return Array.isArray(item) ? item[0] : (item.start ?? 0);
}

const timedScenes = SB.scenes.map((sc, i) => ({
  spec: sc,
  t: i === 0 ? 0 : wordTime(sc.word_start),
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
  const ch = (SB.channel || "NIGHT FILES").toUpperCase();
  const fn = SB.file_num || "08";
  const r = cur.rule_num ?? 0;
  return {
    left: `${ch}  ·  FILE ${fn}  ·  ${r > 0 ? `RULE ${r}` : "INTRO"}`,
    rec: true,
    danger: !!cur.danger,
    hideCaption: cur.scene === "rule_card" || cur.scene === "big_word",
    timer: null as null | { remaining: number; total: number },
  };
};

const SFX_MAP: Record<string, string> = {
  buzz: "sfx_buzz.wav",
  click: "sfx_click.wav",
  sting: "sfx_sting.wav",
  beep: "sfx_beep.wav",
};

export const CUES: Cue[] = timedScenes
  .filter((x) => x.spec.sfx && SFX_MAP[x.spec.sfx])
.map((x) => ({ at: x.t, file: SFX_MAP[x.spec.sfx!], vol: 0.45 }));

export const DROPOUTS: Dropout[] = [];
