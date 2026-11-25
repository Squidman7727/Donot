import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat";
import { Stage, Film, RecHud, CapsCaption, Dial, Soundtrack, shotAt, WordsFile } from "./kit";
import words from "./data/words.json";
import project from "./data/project.json";
import { SHOTS, CUES, DROPOUTS, hudAt } from "./shots";

montserrat("normal", { weights: ["600", "700", "800"] });
const W = words as WordsFile;
const TOTAL = W.duration + (project.tail ?? 2);

/*
 * Layer order (keep it): scene → film finish → HUD → captions → sound.
 * The scene for every moment comes from SHOTS in shots.tsx (one entry per visual, ≤ 6 s each).
 */
export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { shot, local, p, len } = shotAt(SHOTS, t, TOTAL);
  const hud = hudAt(t);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      <Stage bg="#050505">{shot.draw({ t, local, p, len })}</Stage>
      <Film grain={0.05} vignette={0.55} flicker={0.02} tint={hud.danger ? "rgba(120,0,0,0.35)" : undefined} />
      <Stage bg="transparent">
        <RecHud left={hud.left} rec={hud.rec} />
        {shot.overlay?.({ t, local, p, len })}
        {hud.timer && <Dial remaining={hud.timer.remaining} total={hud.timer.total} />}
      </Stage>
      {!hud.hideCaption && <CapsCaption words={W.words} />}
      <Soundtrack vo={project.vo} bed={project.bed || undefined} bedVol={0.12} total={TOTAL} cues={CUES} dropouts={DROPOUTS} />
    </AbsoluteFill>
  );
};
