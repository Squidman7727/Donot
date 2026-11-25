import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

/** Draw everything on a fixed 1280×720 logical stage; it is scaled to the composition size (e.g. 1920×1080). */
export const STAGE_W = 1280;
export const STAGE_H = 720;

export const Stage: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = "#050505" }) => {
  const { width, height } = useVideoConfig();
  const s = Math.min(width / STAGE_W, height / STAGE_H);
  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: STAGE_W,
          height: STAGE_H,
          left: (width - STAGE_W * s) / 2,
          top: (height - STAGE_H * s) / 2,
          transform: `scale(${s})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** An SVG layer covering the stage (viewBox 1280×720). Use for vector styles (1, 3, 4-2D, 5). */
export const SvgLayer: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg
    width={STAGE_W}
    height={STAGE_H}
    viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
    style={{ position: "absolute", left: 0, top: 0, ...style }}
  >
    {children}
  </svg>
);

/**
 * Camera zoom onto a region of the SAME drawing (never redraw for close-ups).
 * rect = the region to fill the frame; p = 0..1 progress from full view to rect.
 */
export const zoomTransform = (rect: { x: number; y: number; w: number; h: number }, p: number) => {
  const s = Math.min(STAGE_W / rect.w, STAGE_H / rect.h);
  const scale = 1 + (s - 1) * p;
  // focal point travels from the stage centre to the rect centre
  const fx = STAGE_W / 2 + (rect.x + rect.w / 2 - STAGE_W / 2) * p;
  const fy = STAGE_H / 2 + (rect.y + rect.h / 2 - STAGE_H / 2) * p;
  return `translate(${STAGE_W / 2 - fx * scale} ${STAGE_H / 2 - fy * scale}) scale(${scale})`;
};
