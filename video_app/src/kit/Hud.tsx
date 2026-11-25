import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { SvgLayer } from "./Stage";

/* All HUDs are drawn in stage coordinates (1280×720). Place them inside <Stage>. */

export const timecode = (frame: number, fps: number) => {
  const s = Math.floor(frame / fps);
  const ff = frame % fps;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(ff)}`;
};

const mono = "'Courier New', monospace";

/** Rule progress boxes; geometry shared with ruleBoxRect so highlights land exactly on a box. */
export const ruleBoxRect = (cx: number, cy: number, size: number, i: number, count = 7) => {
  const gap = size * 0.35;
  const total = count * size + (count - 1) * gap;
  return { x: cx - total / 2 + (i - 1) * (size + gap), y: cy - size / 2, w: size, h: size };
};

export const RuleBoxes: React.FC<{
  cx: number;
  cy: number;
  size: number;
  active?: number; // current rule (1-based); 0 = none
  done?: number; // rules completed (filled)
  count?: number;
  fill?: string;
  stroke?: string;
  ink?: string;
  highlightLast?: string; // e.g. yellow outline on box 7 for "the seventh explains…"
  numbers?: boolean;
}> = ({ cx, cy, size, active = 0, done = 0, count = 7, fill = "#F4F4F1", stroke = "#F4F4F1", ink = "#050505", highlightLast, numbers = true }) => (
  <g>
    {Array.from({ length: count }).map((_, k) => {
      const i = k + 1;
      const r = ruleBoxRect(cx, cy, size, i, count);
      const on = i === active || i <= done;
      const last = highlightLast && i === count;
      return (
        <g key={i}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={size * 0.18} fill={on ? fill : "none"} stroke={last ? highlightLast : stroke} strokeWidth={Math.max(1.2, size * 0.08)} />
          {numbers && (
            <text x={r.x + r.w / 2} y={cy + size * 0.19} textAnchor="middle" fontFamily="Montserrat" fontWeight={700} fontSize={size * 0.52} fill={on ? ink : last ? highlightLast : stroke}>
              {i}
            </text>
          )}
        </g>
      );
    })}
  </g>
);

/** Style 1: FILE code top-left, running timecode top-right, 7 tiny boxes top-centre (from Rule 1). */
export const FileHud: React.FC<{ file: string; codename: string; rule?: number; showBoxes?: boolean; opacity?: number }> = ({
  file,
  codename,
  rule = 0,
  showBoxes = true,
  opacity = 0.55,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grey = "#8A8A8A";
  return (
    <SvgLayer style={{ opacity }}>
      <text x={40} y={42} fontFamily={mono} fontSize={11} letterSpacing={3} fill={grey}>
        {`FILE ${file} // ${codename.toUpperCase()}`}
      </text>
      <text x={1240} y={42} textAnchor="end" fontFamily={mono} fontSize={11} letterSpacing={2} fill={grey}>
        {timecode(frame, fps)}
      </text>
      {showBoxes && rule > 0 && <RuleBoxes cx={640} cy={38} size={13} active={rule} fill={grey} stroke={grey} ink="#050505" />}
    </SvgLayer>
  );
};

/** Style 5 (Lullorin / Nightora): channel · file · rule top-left, optional red REC dot + timecode top-right. */
export const RecHud: React.FC<{ left: string; rec?: boolean }> = ({ left, rec = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const blink = Math.floor(frame / (fps / 2)) % 2 === 0;
  return (
    <SvgLayer style={{ opacity: 0.6 }}>
      <text x={40} y={40} fontFamily={mono} fontSize={11} letterSpacing={3} fill="#9A9A9A">
        {left.toUpperCase()}
      </text>
      {rec && blink && <circle cx={1150} cy={36} r={4.5} fill="#E5292B" />}
      <text x={1240} y={40} textAnchor="end" fontFamily={mono} fontSize={11} letterSpacing={2} fill="#9A9A9A">
        {timecode(frame, fps)}
      </text>
    </SvgLayer>
  );
};

/** Style 6: THE NIGHT DESK · LOG N top-left, red rule boxes top-centre, REC timecode top-right, countdown box. */
export const NightDeskHud: React.FC<{ log: string; rule?: number; count?: number; countdown?: number | null }> = ({
  log,
  rule = 0,
  count = 7,
  countdown = null,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grey = "#9AA3A6";
  const red = "#E5292B";
  const mm = countdown != null ? `${Math.floor(Math.max(0, countdown) / 60)}:${String(Math.floor(Math.max(0, countdown) % 60)).padStart(2, "0")}` : "";
  return (
    <SvgLayer>
      <text x={40} y={38} fontFamily={mono} fontSize={10.5} letterSpacing={3} fill={grey} opacity={0.75}>
        {`THE NIGHT DESK  ·  LOG ${log}`}
      </text>
      {rule > 0 && <RuleBoxes cx={640} cy={34} size={12} done={rule - 1} active={rule} count={count} fill={red} stroke={red} ink="#fff" />}
      <circle cx={1112} cy={34} r={4} fill={red} opacity={Math.floor(frame / (fps / 2)) % 2 ? 0.35 : 1} />
      <text x={1240} y={38} textAnchor="end" fontFamily={mono} fontSize={10.5} letterSpacing={2} fill={grey} opacity={0.75}>
        {`REC ${timecode(frame, fps)}`}
      </text>
      {countdown != null && (
        <g>
          <text x={1150} y={84} textAnchor="end" fontFamily={mono} fontSize={8} letterSpacing={2} fill={grey}>
            COUNTDOWN
          </text>
          <rect x={1158} y={66} width={82} height={30} rx={3} fill="rgba(0,0,0,0.55)" stroke={red} strokeWidth={2} />
          <text x={1199} y={88} textAnchor="middle" fontFamily="Montserrat" fontWeight={700} fontSize={19} fill="#fff">
            {mm}
          </text>
        </g>
      )}
    </SvgLayer>
  );
};
