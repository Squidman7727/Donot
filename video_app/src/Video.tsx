import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as poppins } from "@remotion/google-fonts/Poppins";
import { Stage, Film, RecHud, Karaoke, Dial, Soundtrack, shotAt, WordsFile } from "./kit";
import words from "./data/words.json";
import project from "./data/project.json";
import { SHOTS, CUES, DROPOUTS, KEYWORDS, hudAt } from "./shots";

montserrat("normal", { weights: ["600", "700", "800"] });
poppins("normal", { weights: ["600", "700", "800"] });
const W = words as WordsFile;
const TOTAL = W.duration + (project.tail ?? 2);

/*
 * Nightora-exact layer order: pure black stage → subtle film finish → minimal REC HUD →
 * word-by-word Karaoke captions (white spoken / dim grey upcoming / red keywords) → sound.
 */
export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { shot, local, p, len } = shotAt(SHOTS, t, TOTAL);
  const hud = hudAt(t);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Stage bg="#000000">{shot.draw({ t, local, p, len })}</Stage>
      <Film grain={0.02} vignette={0.35} flicker={0.01} />
      <Stage bg="transparent">
        <RecHud left={hud.left} rec={hud.rec} />
        {shot.overlay?.({ t, local, p, len })}
        {hud.timer && <Dial remaining={hud.timer.remaining} total={hud.timer.total} />}
      </Stage>
      {!hud.hideCaption && <Karaoke words={W.words} keywords={KEYWORDS} red="#E53935" font="Poppins" size={26} />}
      <Soundtrack vo={project.vo} bed={project.bed || undefined} bedVol={0.11} total={TOTAL} cues={CUES} dropouts={DROPOUTS} />
    </AbsoluteFill>
  );
};
