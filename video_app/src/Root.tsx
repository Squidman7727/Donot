import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import words from "./data/words.json";
import project from "./data/project.json";

// One composition for the whole video. Parts are rendered as frame ranges of "Main"
// (code/render/render_part.sh), so approved parts stay identical in the final render.
export const Root: React.FC = () => (
  <Composition
    id="Main"
    component={Video}
    durationInFrames={Math.ceil((words.duration + (project.tail ?? 2)) * project.fps)}
    fps={project.fps}
    width={project.width ?? 1920}
    height={project.height ?? 1080}
  />
);
