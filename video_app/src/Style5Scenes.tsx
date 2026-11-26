import React from "react";
import { interpolate } from "remotion";
import { SvgLayer } from "./kit";

export type SceneSpec = {
  id: string;
  word_start: number;
  start_sec?: number;
  cue?: string;
  scene: string;
  svg?: string;
  visual_brief?: string;
  rule_num?: number;
  title?: string;
  subtitle?: string;
  sender?: string;
  messages?: string[];
  distance?: string;
  bubble?: string;
  clock?: string;
  hair?: "short" | "messy" | "bun" | "hoodie";
  mood?: "neutral" | "scared" | "gasp" | "cry" | "smile";
  target?: "phone" | "curtain" | "door" | "lamp";
  words?: string[];
  figure_outside?: boolean;
  curtain_closed?: boolean;
  door_ajar?: boolean;
  shadow_inside?: boolean;
  outside_figure?: boolean;
  inside_figure?: boolean;
  highlight_room?: boolean;
  wrong_smile?: boolean;
  blinds?: boolean;
  dawn?: boolean;
  feet?: boolean;
  sound_waves?: boolean;
  show_q7?: boolean;
  rule_text?: string;
  step?: number;
  danger?: boolean;
  sfx?: string;
};

type P = { spec: SceneSpec; local: number; p: number; len: number };

const WHITE = "#F2F2F2";
const GRAY_LIGHT = "#D2D4D6";
const GRAY_MID = "#7A7E82";
const RED = "#FF3B30";
const AMBER = "#F2B84B";
const BLUE = "#4DA6FF";
const BLUE_TEAR = "#7EC8F2";

const Bubble: React.FC<{ x: number; y: number; text: string; dark?: boolean; p: number }> = ({
  x,
  y,
  text,
  dark = false,
  p,
}) => {
  if (!text || typeof text !== "string") return null;
  const op = interpolate(p, [0.05, 0.18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const w = Math.max(140, Math.min(480, text.length * 13.2 + 44));
  const h = 44;
  return (
    <g opacity={op} transform={`translate(${x} ${y})`}>
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={12}
        fill={dark ? "#1D2025" : "#EAECEF"}
        stroke={dark ? "#4A5058" : "none"}
        strokeWidth={1.5}
      />
      <polygon points={`-8,${h / 2 - 1} 8,${h / 2 - 1} 0,${h / 2 + 11}`} fill={dark ? "#1D2025" : "#EAECEF"} />
      <text
        x={0}
        y={6}
        textAnchor="middle"
        fontFamily="Poppins, Montserrat, sans-serif"
        fontWeight={600}
        fontSize={20}
        fill={dark ? "#FFFFFF" : "#111315"}
      >
        {text.slice(0, 38)}
      </text>
    </g>
  );
};

const SilhouetteFigure: React.FC<{ x: number; y: number; scale?: number; glowEyes?: boolean }> = ({
  x,
  y,
  scale = 1,
  glowEyes = false,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <line x1={-11} y1={0} x2={-11} y2={28} stroke="#383C42" strokeWidth={5} />
    <line x1={11} y1={0} x2={11} y2={28} stroke="#383C42" strokeWidth={5} />
    <path d="M-32,2 L-22,-115 Q0,-128 22,-115 L32,2 Z" fill="#1E2024" stroke="#454A52" strokeWidth={1.5} />
    <circle cx={0} cy={-146} r={24} fill="#1E2024" stroke="#525862" strokeWidth={1.5} />
    {glowEyes && (
      <>
        <circle cx={-8} cy={-148} r={3.2} fill={WHITE} />
        <circle cx={8} cy={-148} r={3.2} fill={WHITE} />
      </>
    )}
  </g>
);

const ProtagBody: React.FC<{ x: number; y: number; scale?: number; scared?: boolean }> = ({
  x,
  y,
  scale = 1,
  scared = false,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x={-24} y={-56} width={48} height={74} rx={22} fill={GRAY_LIGHT} />
    <circle cx={0} cy={-86} r={25} fill={GRAY_LIGHT} />
    <path d="M-25,-92 C-18,-116 18,-116 25,-92 Q0,-100 -25,-92 Z" fill={GRAY_MID} />
    <circle cx={-8} cy={-86} r={scared ? 4 : 2.8} fill="#111" />
    <circle cx={8} cy={-86} r={scared ? 4 : 2.8} fill="#111" />
    {scared ? (
      <ellipse cx={0} cy={-74} rx={4.5} ry={5.5} fill="#111" />
    ) : (
      <line x1={-7} y1={-75} x2={7} y2={-75} stroke="#111" strokeWidth={2.4} strokeLinecap="round" />
    )}
  </g>
);

const RuleProgressDots: React.FC<{ cx: number; cy: number; active: number; redLast?: boolean; size?: number }> = ({
  cx,
  cy,
  active,
  redLast = false,
  size = 14,
}) => {
  const gap = size * 0.65;
  const total = 7 * size + 6 * gap;
  return (
    <g>
      {Array.from({ length: 7 }).map((_, i) => {
        const idx = i + 1;
        const x = cx - total / 2 + i * (size + gap);
        const filled = idx <= active;
        const isLastRed = redLast && idx === 7;
        return (
          <rect
            key={idx}
            x={x}
            y={cy - size / 2}
            width={size}
            height={size}
            rx={3}
            fill={isLastRed ? RED : filled ? WHITE : "none"}
            stroke={isLastRed ? RED : WHITE}
            strokeWidth={1.8}
            opacity={filled || isLastRed ? 1 : 0.4}
          />
        );
      })}
    </g>
  );
};

export const RenderStyle5Scene: React.FC<P> = ({ spec, local, p }) => {
  const fadeIn = interpolate(local, [0, 0.14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = interpolate(p, [0, 1], [1.0, 1.045], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bubble = typeof spec.bubble === "string" ? spec.bubble : "";
  const clockText = typeof spec.clock === "string" && spec.clock ? spec.clock : "2:14";
  const sender = typeof spec.sender === "string" && spec.sender ? spec.sender : "UNKNOWN";

  const content = (() => {
    switch (spec.scene) {
      case "custom_svg": {
        if (typeof spec.svg === "string" && spec.svg.trim().length > 0) {
          return (
            <g>
              <g dangerouslySetInnerHTML={{ __html: spec.svg }} />
              {bubble && <Bubble x={640} y={135} text={bubble} dark p={p} />}
            </g>
          );
        }
        return (
          <g transform="translate(640 355)">
            <circle cx={0} cy={0} r={140} fill="#1B1E23" stroke="#545963" strokeWidth={4} />
          </g>
        );
      }

      case "phone_text": {
        const msgs =
          Array.isArray(spec.messages) && spec.messages.length > 0
            ? spec.messages.slice(0, 3)
            : bubble
              ? [bubble]
              : ["I'm outside.", "Look out the window."];
        return (
          <g transform="translate(640 350)">
            {/* Phone chassis */}
            <rect x={-148} y={-255} width={296} height={510} rx={34} fill="#0A0C10" stroke={WHITE} strokeWidth={3} />
            <rect x={-42} y={-238} width={84} height={10} rx={5} fill="#252830" />
            {/* Header */}
            <text x={0} y={-196} textAnchor="middle" fontFamily="Montserrat" fontWeight={700} fontSize={20} fill={WHITE}>
              {sender.toUpperCase()}
            </text>
            <text x={0} y={-174} textAnchor="middle" fontFamily="'Courier New', monospace" fontSize={13} fill={GRAY_MID}>
              {`${clockText} · NOW`}
            </text>
            <line x1={-130} y1={-158} x2={130} y2={-158} stroke="#282C34" strokeWidth={1.5} />
            {/* Incoming text bubbles animating in sequentially */}
            {msgs.map((m, i) => {
              const showAt = i * 0.25;
              const op = interpolate(p, [showAt, showAt + 0.14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const y = -115 + i * 84;
              const isAlert = i === msgs.length - 1 && !!spec.danger;
              return (
                <g key={i} opacity={op}>
                  <rect
                    x={-124}
                    y={y}
                    width={228}
                    height={58}
                    rx={16}
                    fill={isAlert ? "#3B1214" : "#1E222A"}
                    stroke={isAlert ? RED : "#3A404C"}
                    strokeWidth={1.6}
                  />
                  <text x={-106} y={y + 35} fontFamily="Poppins, sans-serif" fontWeight={600} fontSize={17} fill={WHITE}>
                    {String(m).slice(0, 24)}
                  </text>
                </g>
              );
            })}
            {/* Typing dots at bottom */}
            <g opacity={0.45 + 0.45 * Math.sin(local * 6)}>
              <circle cx={-95} cy={175} r={5} fill={GRAY_MID} />
              <circle cx={-77} cy={175} r={5} fill={GRAY_MID} />
              <circle cx={-59} cy={175} r={5} fill={GRAY_MID} />
            </g>
          </g>
        );
      }

      case "phone_call": {
        const pulse = 1 + 0.08 * Math.sin(local * 8);
        return (
          <g transform="translate(640 350)">
            <rect x={-148} y={-255} width={296} height={510} rx={34} fill="#0A0C10" stroke={WHITE} strokeWidth={3} />
            <circle cx={0} cy={-110} r={48 * pulse} fill="none" stroke={RED} strokeWidth={2} opacity={0.4} />
            <circle cx={0} cy={-110} r={42} fill="#1E222A" stroke={WHITE} strokeWidth={2} />
            <circle cx={0} cy={-120} r={14} fill={GRAY_MID} />
            <path d="M-24,-84 Q0,-104 24,-84" fill={GRAY_MID} />
            <text x={0} y={-28} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={26} fill={WHITE}>
              {sender.toUpperCase()}
            </text>
            <text x={0} y={4} textAnchor="middle" fontFamily="'Courier New', monospace" fontSize={15} fill={RED}>
              {(spec.subtitle || "INCOMING CALL...").toUpperCase()}
            </text>
            {/* Decline / Accept circles */}
            <circle cx={-66} cy={155} r={30} fill={RED} />
            <line x1={-78} y1={155} x2={-54} y2={155} stroke={WHITE} strokeWidth={4} strokeLinecap="round" />
            <circle cx={66} cy={155} r={30} fill="#2ECC71" opacity={0.85} />
            <circle cx={66} cy={155} r={10} fill="none" stroke={WHITE} strokeWidth={3.5} />
          </g>
        );
      }

      case "phone_map": {
        const redX = interpolate(p, [0, 1], [860, 665], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const redY = interpolate(p, [0, 1], [235, 345], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const ring = 14 + (local * 26) % 28;
        return (
          <g>
            {/* Minimalist dark street grid */}
            {[180, 320, 460, 600].map((y) => (
              <line key={y} x1={160} y1={y} x2={1120} y2={y} stroke="#1F242D" strokeWidth={2} />
            ))}
            {[260, 450, 640, 830, 1020].map((x) => (
              <line key={x} x1={x} y1={110} x2={x} y2={610} stroke="#1F242D" strokeWidth={2} />
            ))}
            <rect x={160} y={110} width={960} height={500} rx={14} fill="none" stroke={WHITE} strokeWidth={2.2} />
            {/* YOU blue dot */}
            <circle cx={640} cy={360} r={12} fill={BLUE} />
            <text x={640} y={398} textAnchor="middle" fontFamily="Montserrat" fontWeight={700} fontSize={15} fill={BLUE}>
              YOU
            </text>
            {/* Approaching RED dot */}
            <circle cx={redX} cy={redY} r={ring} fill="none" stroke={RED} strokeWidth={2} opacity={0.6} />
            <circle cx={redX} cy={redY} r={11} fill={RED} />
            <text x={redX} y={redY - 22} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={16} fill={RED}>
              {`${sender.toUpperCase()} · ${(spec.distance || "12 FT AWAY").toUpperCase()}`}
            </text>
          </g>
        );
      }

      case "window_outside": {
        const curtainW = spec.curtain_closed
          ? interpolate(p, [0, 0.55], [40, 275], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 40;
        const sky = spec.dawn ? "#222C3C" : "#070B12";
        return (
          <g>
            {/* Window frame looking out into dark street */}
            <rect x={365} y={110} width={550} height={430} fill={sky} stroke={WHITE} strokeWidth={3} />
            {/* Outside horizon & streetlight glow */}
            <line x1={365} y1={450} x2={915} y2={450} stroke="#2B323D" strokeWidth={2} />
            <circle cx={790} cy={200} r={22} fill={spec.dawn ? "#9AA9BF" : "#D6DAE2"} opacity={0.85} />
            {/* Figure standing outside staring up */}
            {spec.figure_outside !== false && <SilhouetteFigure x={545} y={485} scale={0.95} glowEyes={spec.danger} />}
            {/* Window crossbars */}
            <line x1={640} y1={110} x2={640} y2={540} stroke={WHITE} strokeWidth={2.5} />
            <line x1={365} y1={325} x2={915} y2={325} stroke={WHITE} strokeWidth={2.5} />
            {/* Curtains */}
            <rect x={365} y={110} width={curtainW} height={430} fill="#14161A" stroke="#353942" strokeWidth={1.5} />
            <rect x={915 - curtainW} y={110} width={curtainW} height={430} fill="#14161A" stroke="#353942" strokeWidth={1.5} />
            {bubble && <Bubble x={640} y={160} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "street_lamp": {
        const flicker = Math.sin(local * 19) > 0.88 ? 0.08 : 0.22;
        return (
          <g>
            <line x1={0} y1={550} x2={1280} y2={550} stroke={WHITE} strokeWidth={2.5} />
            {/* Streetlamp post */}
            <line x1={790} y1={550} x2={790} y2={130} stroke={WHITE} strokeWidth={4} />
            <line x1={790} y1={130} x2={640} y2={130} stroke={WHITE} strokeWidth={4} />
            <rect x={612} y={128} width={44} height={12} rx={4} fill={AMBER} />
            {/* Cone of streetlight */}
            <polygon points="634,140 370,550 890,550" fill={`rgba(242,198,110,${flicker})`} />
            {/* Still figure standing under the light */}
            <SilhouetteFigure x={634} y={522} scale={1.18} glowEyes={spec.danger} />
            {bubble && <Bubble x={634} y={280} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "bedroom_dark": {
        const dawnOp = spec.dawn ? interpolate(p, [0, 0.8], [0.1, 0.28], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
        return (
          <g>
            <line x1={0} y1={545} x2={1280} y2={545} stroke={WHITE} strokeWidth={2.5} />
            {/* Left bedroom door */}
            <rect x={28} y={240} width={115} height={305} fill={spec.door_ajar ? "#16191F" : "none"} stroke={WHITE} strokeWidth={2.2} />
            {spec.door_ajar && <rect x={118} y={240} width={24} height={305} fill="rgba(242,184,75,0.22)" />}
            <circle cx={125} cy={405} r={4.5} fill={WHITE} />
            {/* Nightstand + red LED clock */}
            <rect x={195} y={445} width={115} height={100} fill="none" stroke={WHITE} strokeWidth={2} />
            <rect x={215} y={405} width={76} height={34} rx={5} fill="#080808" stroke={WHITE} strokeWidth={1.8} />
            <text x={253} y={429} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={20} fill={RED}>
              {clockText}
            </text>
            {/* 4-pane window */}
            <rect x={470} y={135} width={235} height={190} fill={spec.dawn ? "#1D2634" : "#080D16"} stroke={WHITE} strokeWidth={2.2} />
            <line x1={587} y1={135} x2={587} y2={325} stroke={WHITE} strokeWidth={2} />
            <line x1={470} y1={230} x2={705} y2={230} stroke={WHITE} strokeWidth={2} />
            {spec.dawn && <polygon points="470,325 705,325 460,545 210,545" fill={`rgba(195,210,230,${dawnOp})`} />}
            {/* Simple bed on right */}
            <rect x={800} y={465} width={350} height={50} rx={6} fill="none" stroke={WHITE} strokeWidth={2.2} />
            <line x1={800} y1={395} x2={800} y2={545} stroke={WHITE} strokeWidth={2.8} />
            <line x1={1150} y1={465} x2={1150} y2={545} stroke={WHITE} strokeWidth={2.5} />
            <rect x={818} y={442} width={72} height={22} rx={8} fill={GRAY_MID} />
            {/* Protagonist standing or in room */}
            <ProtagBody x={560} y={525} scale={1.1} scared={spec.danger} />
            {spec.shadow_inside && <SilhouetteFigure x={190} y={518} scale={1.08} glowEyes={spec.danger} />}
            {bubble && <Bubble x={580} y={290} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "hallway_view": {
        return (
          <g>
            {/* Perspective hallway lines */}
            <polygon points="0,70 460,210 460,470 0,620" fill="none" stroke="#353942" strokeWidth={2} />
            <polygon points="1280,70 820,210 820,470 1280,620" fill="none" stroke="#353942" strokeWidth={2} />
            <rect x={460} y={210} width={360} height={260} fill="#08090C" stroke={WHITE} strokeWidth={2.2} />
            {/* Door at end of hallway */}
            <rect x={575} y={248} width={130} height={222} fill="none" stroke={WHITE} strokeWidth={2.4} />
            {spec.door_ajar && <rect x={675} y={248} width={30} height={222} fill="rgba(242,184,75,0.28)" />}
            {spec.shadow_inside && <SilhouetteFigure x={640} y={452} scale={0.85} glowEyes={spec.danger} />}
            {bubble && <Bubble x={640} y={175} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "door_crack": {
        const feetOp = spec.feet ? interpolate(p, [0.15, 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
        return (
          <g>
            <line x1={0} y1={555} x2={1280} y2={555} stroke={WHITE} strokeWidth={2.5} />
            <rect x={250} y={85} width={780} height={470} fill="none" stroke={WHITE} strokeWidth={3} />
            <circle cx={965} cy={355} r={8} fill={WHITE} />
            <rect x={252} y={546} width={776} height={9} fill={AMBER} opacity={0.85} />
            {spec.feet && (
              <g opacity={feetOp}>
                <rect x={495} y={544} width={118} height={12} rx={3} fill="#080808" />
                <rect x={665} y={544} width={118} height={12} rx={3} fill="#080808" />
              </g>
            )}
            {bubble && <Bubble x={640} y={142} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "door_peephole": {
        return (
          <g transform="translate(640 345)">
            <defs>
              <clipPath id="peepClip">
                <circle cx={0} cy={0} r={195} />
              </clipPath>
            </defs>
            <circle cx={0} cy={0} r={202} fill="#14171D" stroke={WHITE} strokeWidth={4} />
            <g clipPath="url(#peepClip)">
              <rect x={-210} y={-210} width={420} height={420} fill="#0B0E14" />
              <SilhouetteFigure x={0} y={240} scale={1.85} glowEyes />
            </g>
            {bubble && <Bubble x={0} y={-230} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "stairs_creak": {
        const stepNum = Math.min(7, Math.max(1, spec.step || Math.floor(p * 4) + 2));
        const sx = 180 + stepNum * 115;
        const sy = 535 - stepNum * 56;
        const pulse = 0.45 + 0.55 * Math.abs(Math.sin(local * 5));
        const pts: string[] = [];
        for (let i = 0; i < 8; i++) {
          const x0 = 120 + i * 115;
          const y0 = 545 - i * 56;
          pts.push(`${x0},${y0} ${x0 + 115},${y0} ${x0 + 115},${y0 - 56}`);
        }
        return (
          <g>
            <line x1={0} y1={545} x2={1280} y2={545} stroke={WHITE} strokeWidth={2.5} />
            <polyline points={pts.join(" ")} fill="none" stroke={WHITE} strokeWidth={3} />
            <g stroke={GRAY_MID} strokeWidth={3.5} fill="none" opacity={pulse}>
              <path d={`M${sx},${sy - 32} Q${sx + 18},${sy - 14} ${sx},${sy + 4}`} />
              <path d={`M${sx + 14},${sy - 44} Q${sx + 38},${sy - 14} ${sx + 14},${sy + 16}`} />
            </g>
          </g>
        );
      }

      case "house_cutaway": {
        return (
          <g>
            <line x1={60} y1={540} x2={1220} y2={540} stroke={WHITE} strokeWidth={2.2} />
            <polygon points="180,155 600,72 1020,155" fill="none" stroke={WHITE} strokeWidth={2.2} />
            <rect x={180} y={155} width={840} height={385} fill="none" stroke={WHITE} strokeWidth={2.2} />
            <line x1={180} y1={330} x2={1020} y2={330} stroke={WHITE} strokeWidth={2.2} />
            <rect x={570} y={155} width={24} height={385} fill="#000" stroke={WHITE} strokeWidth={2.2} />
            {spec.highlight_room && (
              <rect x={182} y={157} width={386} height={171} fill="rgba(242,184,75,0.06)" stroke={AMBER} strokeWidth={3.2} />
            )}
            <polyline
              points="760,540 760,508 796,508 796,476 832,476 832,444 868,444 868,412 904,412 904,380 940,380 940,348 975,348"
              fill="none"
              stroke={WHITE}
              strokeWidth={2}
            />
            <ProtagBody x={340} y={310} scale={0.78} scared={spec.danger} />
            {spec.inside_figure && <SilhouetteFigure x={470} y={518} scale={0.68} glowEyes={spec.danger} />}
            {spec.outside_figure !== false && <SilhouetteFigure x={1115} y={518} scale={0.72} glowEyes={spec.danger} />}
            {bubble && <Bubble x={640} y={120} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "mirror_view": {
        const smileCurve = spec.wrong_smile
          ? interpolate(p, [0.1, 0.75], [35, 78], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 35;
        return (
          <g transform="translate(640 345)">
            <rect x={-180} y={-230} width={360} height={450} rx={18} fill="#10141C" stroke={WHITE} strokeWidth={3.5} />
            {/* Diagonal subtle glass reflection */}
            <line x1={-150} y1={-190} x2={-70} y2={-110} stroke="rgba(255,255,255,0.12)" strokeWidth={8} />
            {/* Reflection face */}
            <circle cx={0} cy={-10} r={110} fill="#4E535B" />
            <circle cx={-38} cy={-26} r={16} fill="#111" stroke={WHITE} strokeWidth={3} />
            <circle cx={38} cy={-26} r={16} fill="#111" stroke={WHITE} strokeWidth={3} />
            <path
              d={`M-58,28 Q0,${smileCurve} 58,28`}
              fill="none"
              stroke="#0A0A0A"
              strokeWidth={7}
              strokeLinecap="round"
            />
          </g>
        );
      }

      case "eye_closeup": {
        const pupil = interpolate(p, [0, 0.7], [28, 16], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <g transform="translate(640 345)">
            <path d="M-230,0 Q0,-145 230,0 Q0,145 -230,0 Z" fill="#EAECEF" stroke={WHITE} strokeWidth={4} />
            <circle cx={0} cy={0} r={58} fill="#2B323C" />
            <circle cx={0} cy={0} r={pupil} fill="#050505" />
            <circle cx={-16} cy={-18} r={9} fill="#FFFFFF" opacity={0.85} />
            {spec.blinds && (
              <>
                <rect x={-340} y={-220} width={680} height={150} fill="#000" />
                <rect x={-340} y={70} width={680} height={160} fill="#000" />
                <line x1={-340} y1={-70} x2={340} y2={-70} stroke={WHITE} strokeWidth={3} />
                <line x1={-340} y1={70} x2={340} y2={70} stroke={WHITE} strokeWidth={3} />
              </>
            )}
          </g>
        );
      }

      case "face_protag": {
        const mood = spec.mood || (spec.danger ? "scared" : "neutral");
        const eyeR = mood === "scared" || mood === "gasp" ? 19 : 13;
        return (
          <g transform="translate(640 345)">
            <circle cx={0} cy={15} r={148} fill={GRAY_LIGHT} />
            {/* Hair variation */}
            {spec.hair === "bun" ? (
              <>
                <circle cx={0} cy={-148} r={40} fill={GRAY_MID} />
                <path d="M-144,-44 Q0,-165 144,-44 Q0,-80 -144,-44 Z" fill={GRAY_MID} />
              </>
            ) : spec.hair === "hoodie" ? (
              <path d="M-162,75 C-170,-165 170,-165 162,75 L125,75 C135,-115 -135,-115 -125,75 Z" fill="#3A3E46" />
            ) : (
              <path d="M-150,-38 C-115,-168 115,-168 150,-38 Q0,-88 -150,-38 Z" fill={GRAY_MID} />
            )}
            <line
              x1={-75}
              y1={mood === "scared" || mood === "cry" ? -38 : -44}
              x2={-30}
              y2={mood === "scared" || mood === "cry" ? -52 : -44}
              stroke="#111"
              strokeWidth={9}
              strokeLinecap="round"
            />
            <line
              x1={30}
              y1={mood === "scared" || mood === "cry" ? -52 : -44}
              x2={75}
              y2={mood === "scared" || mood === "cry" ? -38 : -44}
              stroke="#111"
              strokeWidth={9}
              strokeLinecap="round"
            />
            <circle cx={-52} cy={-6} r={eyeR} fill={mood === "scared" || mood === "gasp" ? "#FFF" : "#111"} stroke="#111" strokeWidth={5} />
            <circle cx={52} cy={-6} r={eyeR} fill={mood === "scared" || mood === "gasp" ? "#FFF" : "#111"} stroke="#111" strokeWidth={5} />
            {(mood === "scared" || mood === "gasp") && (
              <>
                <circle cx={-52} cy={-6} r={7} fill="#111" />
                <circle cx={52} cy={-6} r={7} fill="#111" />
              </>
            )}
            {mood === "cry" && <path d="M-85,22 Q-98,55 -85,68 Q-72,55 -85,22 Z" fill={BLUE_TEAR} />}
            {mood === "gasp" || mood === "scared" ? (
              <ellipse cx={0} cy={68} rx={18} ry={24} fill="none" stroke="#111" strokeWidth={8} />
            ) : mood === "cry" ? (
              <path d="M-38,85 Q0,48 38,85" fill="none" stroke="#111" strokeWidth={9} strokeLinecap="round" />
            ) : (
              <line x1={-36} y1={68} x2={36} y2={68} stroke="#111" strokeWidth={9} strokeLinecap="round" />
            )}
            {spec.sound_waves && (
              <g stroke={GRAY_MID} strokeWidth={4} fill="none" opacity={0.6 + 0.35 * Math.sin(local * 6)}>
                <path d="M185,-35 Q205,0 185,35" />
                <path d="M210,-52 Q238,0 210,52" />
              </g>
            )}
            {bubble && <Bubble x={0} y={-190} text={bubble} p={p} />}
          </g>
        );
      }

      case "face_shadow": {
        return (
          <g transform="translate(640 355)">
            <circle cx={0} cy={0} r={158} fill="#1B1E23" stroke="#545963" strokeWidth={5} />
            <ellipse cx={0} cy={14} rx={94} ry={68} fill="#2F333B" opacity={0.65} />
            {bubble && <Bubble x={0} y={-200} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "face_uncanny": {
        const smileCurve = interpolate(p, [0, 0.7], [84, 122], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const revealOp = interpolate(p, [0, 0.35], [0.35, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <g transform="translate(640 355)" opacity={revealOp}>
            <circle cx={0} cy={0} r={158} fill="#5C6066" stroke="#222" strokeWidth={4} />
            <line x1={-82} y1={-56} x2={-32} y2={-56} stroke="#0B0B0B" strokeWidth={9} strokeLinecap="round" />
            <line x1={32} y1={-56} x2={82} y2={-56} stroke="#0B0B0B" strokeWidth={9} strokeLinecap="round" />
            <circle cx={-56} cy={-8} r={28} fill="#7E838A" stroke="#0B0B0B" strokeWidth={8} />
            <circle cx={-56} cy={-8} r={10} fill="#0B0B0B" />
            <circle cx={56} cy={-8} r={28} fill="#7E838A" stroke="#0B0B0B" strokeWidth={8} />
            <circle cx={56} cy={-8} r={10} fill="#0B0B0B" />
            <path d={`M-92,46 Q0,${smileCurve} 92,46`} fill="none" stroke="#0B0B0B" strokeWidth={9} strokeLinecap="round" />
            {bubble && <Bubble x={0} y={-205} text={bubble} p={p} />}
          </g>
        );
      }

      case "hand_reach": {
        const handX = interpolate(p, [0, 0.72], [-40, 295], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const tgt = spec.target || "door";
        return (
          <g>
            {/* Target object on right */}
            {tgt === "phone" ? (
              <rect x={685} y={195} width={150} height={280} rx={22} fill="#0D1016" stroke={WHITE} strokeWidth={3} />
            ) : tgt === "curtain" ? (
              <g>
                <rect x={670} y={120} width={280} height={420} fill="#080D16" stroke={WHITE} strokeWidth={3} />
                <rect x={670} y={120} width={85} height={420} fill="#1E222A" stroke={WHITE} strokeWidth={2} />
              </g>
            ) : tgt === "lamp" ? (
              <g>
                <polygon points="650,260 800,260 770,150 680,150" fill="none" stroke={WHITE} strokeWidth={3} />
                <line x1={725} y1={260} x2={725} y2={420} stroke={WHITE} strokeWidth={3} />
              </g>
            ) : (
              <g>
                <rect x={690} y={120} width={260} height={440} fill="none" stroke={WHITE} strokeWidth={3} />
                <circle cx={735} cy={340} r={18} fill="none" stroke={WHITE} strokeWidth={3} />
              </g>
            )}
            {/* Reaching hand from left */}
            <g transform={`translate(${handX} 330)`}>
              <rect x={-200} y={-24} width={275} height={54} rx={20} fill={GRAY_LIGHT} />
              <rect x={60} y={-24} width={115} height={22} rx={11} fill={GRAY_LIGHT} />
              <circle cx={68} cy={14} r={14} fill={GRAY_LIGHT} />
              <circle cx={62} cy={34} r={13} fill={GRAY_LIGHT} />
            </g>
          </g>
        );
      }

      case "clock_led": {
        let display = clockText;
        if (clockText === "0:10" || clockText === "10") {
          const sec = Math.max(1, 10 - Math.floor(p * 10));
          display = `0:${String(sec).padStart(2, "0")}`;
        }
        return (
          <g transform="translate(640 350) scale(1.25)">
            <rect x={-130} y={-62} width={260} height={124} rx={18} fill="#080808" stroke={WHITE} strokeWidth={3.5} />
            <text
              x={0}
              y={24}
              textAnchor="middle"
              fontFamily="Montserrat, monospace"
              fontWeight={800}
              fontSize={74}
              letterSpacing={4}
              fill={RED}
              style={{ filter: "drop-shadow(0 0 14px rgba(255,59,48,0.85))" }}
            >
              {display}
            </text>
          </g>
        );
      }

      case "notepad_rules": {
        const heading = (spec.title || "THE SEVEN RULES").toUpperCase();
        const drawn = Math.min(7, Math.floor(p * 9) + 1);
        return (
          <g transform="translate(640 345) rotate(-1.5)">
            <rect x={-48} y={-236} width={96} height={24} fill="#C6BE98" opacity={0.85} />
            <rect x={-195} y={-222} width={390} height={455} rx={4} fill="#F3EDD2" />
            <text
              x={0}
              y={-172}
              textAnchor="middle"
              fontFamily="Georgia, serif"
              fontStyle="italic"
              fontWeight={700}
              fontSize={25}
              fill="#1E1D1A"
            >
              {heading.slice(0, 22)}
            </text>
            <line x1={-175} y1={-152} x2={175} y2={-152} stroke="#C9BFA0" strokeWidth={2} />
            {Array.from({ length: 7 }).map((_, i) => {
              const y = -110 + i * 48;
              const is7 = i === 6;
              return (
                <g key={i}>
                  <line x1={-175} y1={y + 18} x2={175} y2={y + 18} stroke="#DCD4B8" strokeWidth={1.2} />
                  {i < drawn && (
                    <>
                      <text x={-158} y={y + 6} fontFamily="Georgia, serif" fontStyle="italic" fontSize={21} fill="#222">
                        {i + 1}.
                      </text>
                      {is7 && (spec.show_q7 || spec.rule_text) ? (
                        <text x={-122} y={y + 6} fontFamily="Georgia, serif" fontStyle="italic" fontWeight={700} fontSize={21} fill="#111">
                          {spec.rule_text || "???"}
                        </text>
                      ) : (
                        <path
                          d={`M-122,${y} Q-92,${y - 8} -62,${y} T-2,${y} T58,${y} T118,${y}`}
                          fill="none"
                          stroke="#2B2A26"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                        />
                      )}
                    </>
                  )}
                </g>
              );
            })}
          </g>
        );
      }

      case "rule_card": {
        const rn = spec.rule_num || 1;
        const is7 = rn === 7 || !!spec.danger;
        const accent = is7 ? RED : WHITE;
        const fullTitle = (spec.title || `RULE ${rn}`).toUpperCase();
        const chars = Math.max(
          1,
          Math.floor(interpolate(p, [0.08, 0.55], [0, fullTitle.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))
        );
        return (
          <g>
            <rect x={548} y={248} width={184} height={68} rx={12} fill="none" stroke={accent} strokeWidth={3} />
            <text
              x={640}
              y={294}
              textAnchor="middle"
              fontFamily="Montserrat, sans-serif"
              fontWeight={800}
              fontSize={34}
              letterSpacing={2}
              fill={accent}
            >
              {`RULE ${rn}`}
            </text>
            <text
              x={640}
              y={374}
              textAnchor="middle"
              fontFamily="Montserrat, sans-serif"
              fontWeight={800}
              fontSize={36}
              letterSpacing={1.5}
              fill={WHITE}
            >
              {fullTitle.slice(0, chars)}
            </text>
            <RuleProgressDots cx={640} cy={432} active={rn} redLast={is7} size={15} />
          </g>
        );
      }

      case "strike_words": {
        const list = Array.isArray(spec.words) && spec.words.length >= 2 ? spec.words.slice(0, 3) : ["LOOK", "REPLY", "OPEN"];
        const xs = list.length === 2 ? [440, 840] : [300, 640, 980];
        return (
          <g>
            {list.map((w, i) => {
              const showAt = i * 0.28;
              const op = interpolate(p, [showAt, showAt + 0.08], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const slash = interpolate(p, [showAt + 0.08, showAt + 0.22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const textStr = `"${String(w).toUpperCase()}"`;
              const halfW = textStr.length * 13;
              return (
                <g key={i} opacity={op}>
                  <text x={xs[i]} y={360} textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight={800} fontSize={40} fill={WHITE}>
                    {textStr}
                  </text>
                  <line
                    x1={xs[i] - halfW}
                    y1={347}
                    x2={xs[i] - halfW + halfW * 2 * slash}
                    y2={347}
                    stroke={RED}
                    strokeWidth={5}
                  />
                </g>
              );
            })}
          </g>
        );
      }

      case "callback_text":
      default: {
        const title = (spec.title || "DON'T LOOK").toUpperCase();
        return (
          <g>
            <text
              x={640}
              y={355}
              textAnchor="middle"
              fontFamily="Montserrat, sans-serif"
              fontWeight={800}
              fontSize={58}
              letterSpacing={3}
              fill={spec.danger ? RED : WHITE}
            >
              {title.slice(0, 26)}
            </text>
            {spec.subtitle && (
              <text
                x={640}
                y={408}
                textAnchor="middle"
                fontFamily="'Courier New', monospace"
                fontSize={20}
                letterSpacing={3}
                fill={GRAY_MID}
              >
                {spec.subtitle}
              </text>
            )}
          </g>
        );
      }
    }
  })();

  return (
    <SvgLayer>
      <g opacity={fadeIn} transform={`translate(640 360) scale(${zoom}) translate(-640 -360)`}>
        {content}
      </g>
    </SvgLayer>
  );
};

export const RenderStyle5Overlay: React.FC<P> = () => null;
