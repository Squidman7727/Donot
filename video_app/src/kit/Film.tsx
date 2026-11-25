import React from "react";
import { AbsoluteFill, useCurrentFrame, random } from "remotion";

/** Film finish: grain + vignette + slight flicker. Put it on top of the picture, under captions/HUD. */
export const Film: React.FC<{ grain?: number; vignette?: number; flicker?: number; tint?: string }> = ({
  grain = 0.08,
  vignette = 0.55,
  flicker = 0.03,
  tint,
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2); // grain changes every 2 frames, like film
  const fl = 1 - flicker * random(`fl${seed}`);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {tint && <AbsoluteFill style={{ background: tint, mixBlendMode: "multiply" }} />}
      <AbsoluteFill style={{ background: `rgba(0,0,0,${1 - fl})` }} />
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)` }}
      />
      {grain > 0 && (
        <svg width="100%" height="100%" style={{ position: "absolute", opacity: grain, mixBlendMode: "screen" }}>
          <filter id={`g${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed % 997} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#g${seed})`} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

/** Soft bloom around white shapes (Styles 1 and 5): wrap the SVG group. */
export const bloomFilter = (id = "bloom", strength = 3) => (
  <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceGraphic" stdDeviation={strength} result="b" />
    <feMerge>
      <feMergeNode in="b" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);
