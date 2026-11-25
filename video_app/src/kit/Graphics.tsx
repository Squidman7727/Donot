import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, random } from "remotion";
import { SvgLayer } from "./Stage";
import { RuleBoxes } from "./Hud";
import { clamp } from "./timing";

/* Reusable graphics in stage coordinates (1280×720). `local` = seconds since the element started. */

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Polished focus highlight: the rest of the frame dims, the target is backlit, a fine white border,
 * an accent bar and optional accent number. ALWAYS pass a rect computed from the target's own geometry.
 */
export const Focus: React.FC<{ rect: Rect; local: number; accent?: string; label?: string; dim?: number; pad?: number; radius?: number }> = ({
  rect,
  local,
  accent = "#FFC63A",
  label,
  dim = 0.62,
  pad = 6,
  radius = 6,
}) => {
  const a = interpolate(local, [0, 0.35], [0, 1], clamp);
  const r = { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 };
  const id = `fm${Math.round(r.x)}_${Math.round(r.y)}`;
  return (
    <SvgLayer>
      <defs>
        <mask id={id}>
          <rect width={1280} height={720} fill="white" />
          <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={radius} fill="black" />
        </mask>
        <radialGradient id={`${id}g`}>
          <stop offset="0%" stopColor="#fff" stopOpacity={0.16} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1280} height={720} fill="#000" opacity={dim * a} mask={`url(#${id})`} />
      <ellipse cx={r.x + r.w / 2} cy={r.y + r.h / 2} rx={r.w * 0.9} ry={r.h * 1.4} fill={`url(#${id}g)`} opacity={a} />
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={radius} fill="none" stroke="#fff" strokeWidth={1.4} opacity={a} />
      <rect x={r.x - 7} y={r.y} width={3.5} height={r.h * a} rx={1.5} fill={accent} />
      {label && (
        <text x={r.x - 14} y={r.y + 13} textAnchor="end" fontFamily="Montserrat" fontWeight={800} fontSize={13} fill={accent} opacity={a}>
          {label}
        </text>
      )}
    </SvgLayer>
  );
};

/** Corner countdown dial (Styles 1–5): small circle, sweeping ring, seconds in the middle. */
export const Dial: React.FC<{ remaining: number; total: number; x?: number; y?: number; r?: number; color?: string; opacity?: number }> = ({
  remaining,
  total,
  x = 1196,
  y = 84,
  r = 30,
  color = "#E5292B",
  opacity = 1,
}) => {
  const frac = Math.max(0, Math.min(1, remaining / total));
  const c = 2 * Math.PI * (r - 4);
  return (
    <SvgLayer style={{ opacity }}>
      <circle cx={x} cy={y} r={r} fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
      <circle cx={x} cy={y} r={r - 4} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${c * frac} ${c}`} transform={`rotate(-90 ${x} ${y})`} strokeLinecap="round" />
      <text x={x} y={y + 7} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={r * 0.62} fill="#fff">
        {Math.ceil(Math.max(0, remaining))}
      </text>
    </SvgLayer>
  );
};

/** Digital glitch tear for section breaks (2–4 frames of noise lines + jitter). Render for ~0.15 s around a cut. */
export const GlitchTear: React.FC<{ local: number; len?: number }> = ({ local, len = 0.15 }) => {
  const frame = useCurrentFrame();
  if (local < 0 || local > len) return null;
  const lines = Array.from({ length: 14 }).map((_, i) => ({
    y: random(`gy${frame}${i}`) * 720,
    h: 2 + random(`gh${frame}${i}`) * 10,
    x: (random(`gx${frame}${i}`) - 0.5) * 120,
    o: 0.4 + random(`go${frame}${i}`) * 0.6,
  }));
  return (
    <SvgLayer>
      <rect width={1280} height={720} fill="#000" opacity={0.35} />
      {lines.map((l, i) => (
        <rect key={i} x={l.x} y={l.y} width={1280} height={l.h} fill={i % 3 === 0 ? "#FF3355" : i % 3 === 1 ? "#33E0FF" : "#fff"} opacity={l.o} />
      ))}
    </SvgLayer>
  );
};

/** Thought bubble up-right of a head (character inner warnings, Styles 3 and 5). */
export const ThoughtBubble: React.FC<{ x: number; y: number; text: string; local: number; w?: number }> = ({ x, y, text, local, w = 250 }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: Math.round(local * fps), fps, config: { damping: 12, stiffness: 140 } });
  const typed = text.slice(0, Math.floor(interpolate(local, [0.15, 0.15 + text.length * 0.035], [0, text.length], clamp)));
  const h = 70;
  return (
    <SvgLayer>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <circle cx={6} cy={-6} r={5} fill="#fff" />
        <circle cx={20} cy={-22} r={8} fill="#fff" />
        <g transform="translate(30 -100)">
          <rect x={0} y={0} width={w} height={h} rx={h / 2} fill="#fff" stroke="#1d1d1d" strokeWidth={3} />
          <text x={w / 2} y={h / 2 + 7} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={19} fill="#111">
            {typed}
          </text>
        </g>
      </g>
    </SvgLayer>
  );
};

/** "Seven rules": big colourful discs 1→7 that flip in one by one (stagger in seconds). */
export const SevenCount: React.FC<{ local: number; cx?: number; cy?: number; count?: number; stagger?: number; colors?: string[] }> = ({
  local,
  cx = 640,
  cy = 360,
  count = 7,
  stagger = 0.18,
  colors = ["#FF5A5F", "#FF9F1C", "#FFD23F", "#3BCEAC", "#2EC4F1", "#7B61FF", "#E5292B"],
}) => {
  const size = 92;
  const gap = 22;
  const total = count * size + (count - 1) * gap;
  return (
    <SvgLayer>
      {Array.from({ length: count }).map((_, i) => {
        const p = interpolate(local, [i * stagger, i * stagger + 0.25], [0, 1], clamp);
        const x = cx - total / 2 + i * (size + gap) + size / 2;
        return (
          <g key={i} transform={`translate(${x} ${cy}) scale(${p} 1)`} opacity={p > 0 ? 1 : 0}>
            <circle r={size / 2} fill={colors[i % colors.length]} />
            <circle r={size / 2 + 10} fill={colors[i % colors.length]} opacity={0.18 * p} />
            <text y={17} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={48} fill="#fff">
              {i + 1}
            </text>
          </g>
        );
      })}
    </SvgLayer>
  );
};

/** Animated rule card. variant: department (Style 1), boxed (Style 5), nightdesk (Style 6). */
export const RuleCard: React.FC<{
  n: number;
  title: string;
  local: number;
  variant?: "department" | "boxed" | "nightdesk";
  count?: number;
  danger?: string[]; // nightdesk: words to colour red
}> = ({ n, title, local, variant = "department", count = 7, danger = [] }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame: Math.round(local * fps), fps, config: { damping: 11, stiffness: 160 } });
  const wipe = interpolate(local, [0.15, 0.45], [0, 1], clamp);
  const titleA = interpolate(local, [0.3, 0.55], [0, 1], clamp);
  const W = "#F4F4F1";
  if (variant === "boxed") {
    return (
      <AbsoluteFill style={{ background: "#050505" }}>
        <SvgLayer>
          <g transform={`translate(640 300) scale(${pop})`}>
            <rect x={-62} y={-26} width={124} height={52} rx={8} fill="none" stroke={W} strokeWidth={3} />
            <text y={11} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={30} fill={W}>{`RULE ${n}`}</text>
          </g>
          <text x={640} y={372} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={26} fill={W} opacity={titleA}>
            {title.toUpperCase()}
          </text>
          <RuleBoxes cx={640} cy={420} size={14} active={n} count={count} numbers={false} />
        </SvgLayer>
      </AbsoluteFill>
    );
  }
  if (variant === "nightdesk") {
    const red = "#FF3B3B";
    const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
    const d = new Set(danger.map(norm));
    return (
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, #1a1d1f 0%, #070809 75%)" }}>
        <SvgLayer>
          <g transform={`translate(640 250) scale(${pop})`}>
            <text x={-14} y={16} textAnchor="end" fontFamily="Montserrat" fontWeight={800} fontSize={46} fill="#fff">RULE</text>
            <rect x={0} y={-26} width={52} height={52} rx={8} fill="#fff" />
            <text x={26} y={16} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={40} fill="#0b0b0b">{n}</text>
          </g>
          <rect x={560} y={290} width={160 * wipe} height={3} fill={red} />
        </SvgLayer>
        <div style={{ position: "absolute", top: 320, left: 200, right: 200, textAlign: "center", fontFamily: "Montserrat", fontWeight: 800, fontSize: 30, lineHeight: 1.2, color: "#fff", opacity: titleA, textTransform: "uppercase" }}>
          {title.split(" ").map((w, i) => (
            <span key={i} style={{ color: d.has(norm(w)) ? red : "#fff" }}>{w} </span>
          ))}
        </div>
        <SvgLayer>
          <RuleBoxes cx={640} cy={470} size={14} done={n - 1} active={n} count={count} fill={red} stroke={red} numbers={false} />
        </SvgLayer>
      </AbsoluteFill>
    );
  }
  // department (Style 1)
  return (
    <AbsoluteFill style={{ background: "#050505" }}>
      <SvgLayer>
        <text x={612} y={322} textAnchor="end" fontFamily="Montserrat" fontWeight={800} fontSize={64} fill={W}>RULE</text>
        <g transform={`translate(660 300) scale(${pop})`}>
          <rect x={-36} y={-40} width={72} height={80} rx={12} fill={W} />
          <text y={24} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={60} fill="#050505">{n}</text>
        </g>
        <rect x={640 - 170 * wipe} y={364} width={340 * wipe} height={4} fill="#E5292B" />
        <text x={640} y={414} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={30} letterSpacing={1} fill={W} opacity={titleA}>
          {title.toUpperCase()}
        </text>
        <RuleBoxes cx={640} cy={470} size={22} active={n} count={count} />
      </SvgLayer>
    </AbsoluteFill>
  );
};

/** Paired speech bubbles (Style 5): a white normal line, then a red typewriter "sinister echo". */
export const SpeechPair: React.FC<{ x: number; y: number; normal: string; echo: string; local: number; echoAt?: number }> = ({
  x,
  y,
  normal,
  echo,
  local,
  echoAt = 0.8,
}) => {
  const a = interpolate(local, [0, 0.2], [0, 1], clamp);
  const typed = echo.slice(0, Math.floor(interpolate(local, [echoAt, echoAt + echo.length * 0.06], [0, echo.length], clamp)));
  const w1 = normal.length * 11 + 40;
  const w2 = echo.length * 12 + 40;
  return (
    <SvgLayer>
      <g opacity={a}>
        <rect x={x} y={y} width={w1} height={40} rx={20} fill="#fff" />
        <text x={x + w1 / 2} y={y + 26} textAnchor="middle" fontFamily="Montserrat" fontWeight={700} fontSize={17} fill="#111">{normal}</text>
      </g>
      {typed && (
        <g>
          <rect x={x + 30} y={y + 54} width={w2} height={40} rx={4} fill="#0a0a0a" stroke="#E5292B" strokeWidth={2} />
          <text x={x + 30 + w2 / 2} y={y + 80} textAnchor="middle" fontFamily="'Courier New', monospace" fontWeight={700} fontSize={19} fill="#E5292B">{typed}</text>
        </g>
      )}
    </SvgLayer>
  );
};

/** Red label banner (Style 6): "THE COIN IS THE TICKET". */
export const Banner: React.FC<{ text: string; local: number; x?: number; y?: number }> = ({ text, local, x = 1240, y = 60 }) => {
  const p = interpolate(local, [0, 0.25], [0, 1], clamp);
  const w = text.length * 8.6 + 28;
  return (
    <SvgLayer>
      <g transform={`translate(${x - w * p} ${y})`}>
        <rect width={w} height={24} fill="#E5292B" />
        <text x={w / 2} y={16.5} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={12} letterSpacing={1} fill="#fff">{text.toUpperCase()}</text>
      </g>
    </SvgLayer>
  );
};

/** Checklist with red ✕ marks appearing one by one (Style 6). */
export const Checklist: React.FC<{ items: string[]; local: number; title?: string; stagger?: number }> = ({ items, local, title, stagger = 0.45 }) => {
  const bw = 150;
  const gap = 24;
  const total = items.length * bw + (items.length - 1) * gap;
  return (
    <SvgLayer>
      {title && (
        <text x={640} y={300} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={30} fill="#fff">{title.toUpperCase()}</text>
      )}
      {items.map((it, i) => {
        const x = 640 - total / 2 + i * (bw + gap);
        const ap = interpolate(local, [i * 0.1, i * 0.1 + 0.2], [0, 1], clamp);
        const xp = interpolate(local, [0.6 + i * stagger, 0.75 + i * stagger], [0, 1], clamp);
        return (
          <g key={i} opacity={ap}>
            <rect x={x} y={330} width={bw} height={50} rx={6} fill="rgba(0,0,0,0.4)" stroke="#fff" strokeWidth={2} />
            <text x={x + bw / 2} y={361} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={15} fill="#fff">{it.toUpperCase()}</text>
            <g stroke="#E5292B" strokeWidth={4} strokeLinecap="round" transform={`translate(${x + bw - 6} 330)`}>
              <line x1={-10} y1={-10} x2={-10 + 20 * xp} y2={-10 + 20 * xp} />
              {xp > 0.5 && <line x1={10} y1={-10} x2={10 - 20 * (xp - 0.5) * 2} y2={-10 + 20 * (xp - 0.5) * 2} />}
            </g>
          </g>
        );
      })}
    </SvgLayer>
  );
};

/** Stat / counter chip (Style 2): dark rounded pill with a label and a live number. */
export const Chip: React.FC<{ label: string; value: number; x: number; y: number; local: number }> = ({ label, value, x, y, local }) => {
  const a = interpolate(local, [0, 0.25], [0, 1], clamp);
  return (
    <SvgLayer>
      <g opacity={a} transform={`translate(${x} ${y})`}>
        <rect x={-150} y={-24} width={300} height={48} rx={24} fill="rgba(15,18,28,0.85)" stroke="rgba(255,255,255,0.18)" />
        <text x={-128} y={6} fontFamily="Montserrat" fontWeight={700} fontSize={13} letterSpacing={1} fill="#9FB3C8">{label.toUpperCase()}</text>
        <text x={132} y={8} textAnchor="end" fontFamily="Montserrat" fontWeight={800} fontSize={20} fill="#fff">{Math.round(value).toLocaleString("en-US")}</text>
      </g>
    </SvgLayer>
  );
};
