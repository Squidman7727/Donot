import React from "react";
import { interpolate } from "remotion";
import { SvgLayer } from "./kit";

export type SceneSpec = {
  id: string;
  word_start: number;
  start_sec?: number;
  cue?: string;
  scene:
    | "house_cutaway"
    | "bedroom_view"
    | "kitchen_view"
    | "face_kid"
    | "face_shadow"
    | "face_smile"
    | "face_mom_cry"
    | "clock_countdown"
    | "notepad_rules"
    | "rule_dots"
    | "rule_card"
    | "strike_words"
    | "door_crack"
    | "stairs_creak"
    | "wrist_grab"
    | "lamp_reach"
    | "hallway_figure"
    | "window_dawn"
    | "flashback_scene"
    | "callback_text"
    | string;
  rule_num?: number;
  title?: string;
  subtitle?: string;
  bubble?: string;
  normal_bubble?: string;
  echo_bubble?: string;
  clock?: string;
  mood?: "neutral" | "scared" | "gasp" | "cry" | "smile";
  words?: string[];
  highlight_room?: boolean;
  both_figures?: boolean;
  grab?: boolean;
  dawn?: boolean;
  trap_box?: boolean;
  feet?: boolean;
  stretch?: boolean;
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
const GRAY_DARK = "#2B2E32";
const RED = "#FF3B30";
const AMBER = "#F2B84B";
const BLUE_TEAR = "#7EC8F2";

const Bubble: React.FC<{ x: number; y: number; text: string; dark?: boolean; p: number }> = ({
  x,
  y,
  text,
  dark = false,
  p,
}) => {
  const op = interpolate(p, [0.05, 0.18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const w = Math.max(130, Math.min(460, text.length * 13.5 + 42));
  const h = 44;
  return (
    <g opacity={op} transform={`translate(${x} ${y})`}>
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={12}
        fill={dark ? "#1F2226" : "#EAECEF"}
        stroke={dark ? "#4A4F57" : "none"}
        strokeWidth={1.5}
      />
      <polygon
        points={`-8,${h / 2 - 1} 8,${h / 2 - 1} 0,${h / 2 + 11}`}
        fill={dark ? "#1F2226" : "#EAECEF"}
      />
      <text
        x={0}
        y={6}
        textAnchor="middle"
        fontFamily="Poppins, Montserrat, sans-serif"
        fontWeight={600}
        fontSize={20}
        fill={dark ? "#FFFFFF" : "#111315"}
      >
        {text}
      </text>
    </g>
  );
};

const KidBody: React.FC<{ x: number; y: number; scale?: number; scared?: boolean }> = ({
  x,
  y,
  scale = 1,
  scared = false,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {/* Rounded body */}
    <rect x={-26} y={-55} width={52} height={74} rx={24} fill={GRAY_LIGHT} />
    {/* Head */}
    <circle cx={0} cy={-86} r={27} fill={GRAY_LIGHT} />
    {/* Wavy cap/hair */}
    <path d="M-28,-94 C-22,-118 22,-118 28,-94 Z" fill={GRAY_MID} />
    <ellipse cx={0} cy={-95} rx={30} ry={6} fill={GRAY_MID} />
    {/* Eyes */}
    <circle cx={-9} cy={-86} r={scared ? 4.2 : 3} fill="#111" />
    <circle cx={9} cy={-86} r={scared ? 4.2 : 3} fill="#111" />
    {/* Mouth */}
    {scared ? (
      <ellipse cx={0} cy={-74} rx={4.5} ry={5.5} fill="#111" />
    ) : (
      <line x1={-7} y1={-75} x2={7} y2={-75} stroke="#111" strokeWidth={2.5} strokeLinecap="round" />
    )}
  </g>
);

const ShadowMomBody: React.FC<{ x: number; y: number; scale?: number; light?: boolean }> = ({
  x,
  y,
  scale = 1,
  light = false,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {/* Legs */}
    <line x1={-12} y1={0} x2={-12} y2={26} stroke={light ? GRAY_LIGHT : "#3D4044"} strokeWidth={5} />
    <line x1={12} y1={0} x2={12} y2={26} stroke={light ? GRAY_LIGHT : "#3D4044"} strokeWidth={5} />
    {/* Dress / coat silhouette */}
    <polygon
      points="-48,2 48,2 24,-138 -24,-138"
      fill={light ? GRAY_LIGHT : "#26282B"}
      stroke={light ? "none" : "#44484E"}
      strokeWidth={1.5}
    />
    {/* Two subtle buttons/hands */}
    {!light && (
      <>
        <circle cx={-28} cy={-38} r={4.5} fill="#D9DADB" />
        <circle cx={28} cy={-38} r={4.5} fill="#D9DADB" />
      </>
    )}
    {/* Head & bun */}
    <circle cx={0} cy={-166} r={28} fill={light ? GRAY_LIGHT : "#26282B"} stroke={light ? "none" : "#555A62"} strokeWidth={1.5} />
    <circle cx={0} cy={-196} r={11} fill={light ? GRAY_MID : "#5A5E66"} />
    <path d="M-26,-172 Q0,-195 26,-172" fill={light ? GRAY_MID : "#5A5E66"} />
    {light && (
      <>
        <circle cx={-8} cy={-166} r={3} fill="#111" />
        <circle cx={8} cy={-166} r={3} fill="#111" />
        <path d="M-7,-154 Q0,-160 7,-154" fill="none" stroke="#111" strokeWidth={2.2} />
        <path d="M-12,-160 Q-16,-150 -12,-147 Q-8,-150 -12,-160 Z" fill={BLUE_TEAR} />
      </>
    )}
  </g>
);

const LedClock: React.FC<{ x: number; y: number; text: string; scale?: number }> = ({ x, y, text, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
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
      {text}
    </text>
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
  const fadeIn = interpolate(local, [0, 0.16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = interpolate(p, [0, 1], [1.0, 1.045], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bubble = spec.bubble || spec.normal_bubble || spec.echo_bubble || "";
  const clockText = spec.clock || "9:14";
  const st = spec.scene;

  const content = (() => {
    switch (st) {
      case "house_cutaway": {
        const showBoth = !!spec.both_figures;
        return (
          <g>
            {/* Outer house wireframe */}
            <polygon points="150,155 640,70 1130,155" fill="none" stroke={WHITE} strokeWidth={2.2} />
            <rect x={150} y={155} width={980} height={385} fill="none" stroke={WHITE} strokeWidth={2.2} />
            {/* Second floor line */}
            <line x1={150} y1={330} x2={1130} y2={330} stroke={WHITE} strokeWidth={2.2} />
            {/* Central hallway wall & door */}
            <rect x={588} y={155} width={28} height={385} fill="#000" stroke={WHITE} strokeWidth={2.2} />
            <circle cx={602} cy={355} r={3.5} fill={WHITE} />
            {/* Optional room highlight box */}
            {spec.highlight_room && (
              <rect
                x={152}
                y={157}
                width={434}
                height={171}
                fill="rgba(242,184,75,0.06)"
                stroke={AMBER}
                strokeWidth={3.5}
              />
            )}
            {/* Warm kitchen hanging light cone downstairs */}
            <line x1={420} y1={330} x2={420} y2={352} stroke={AMBER} strokeWidth={2} />
            <circle cx={420} cy={355} r={6} fill={AMBER} />
            <polygon points="420,358 300,540 540,540" fill="rgba(242,184,75,0.18)" />
            {/* Kitchen counter downstairs */}
            <rect x={198} y={462} width={88} height={78} fill="none" stroke={WHITE} strokeWidth={1.8} />
            <rect x={218} y={444} width={48} height={18} rx={3} fill={GRAY_MID} />
            {/* Stairs on right */}
            <polyline
              points="835,540 835,508 872,508 872,476 909,476 909,444 946,444 946,412 983,412 983,380 1020,380 1020,348 1055,348"
              fill="none"
              stroke={WHITE}
              strokeWidth={2}
            />
            {/* Kid upstairs */}
            <KidBody x={320} y={310} scale={0.78} scared={spec.danger} />
            {/* Shadow figure upstairs and/or downstairs */}
            {showBoth && <ShadowMomBody x={450} y={308} scale={0.68} />}
            <ShadowMomBody x={500} y={518} scale={0.68} />
            {bubble && <Bubble x={420} y={415} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "bedroom_view": {
        const armReach = spec.grab ? interpolate(p, [0, 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
        const dawnOp = spec.dawn ? interpolate(p, [0, 0.8], [0.12, 0.32], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
        return (
          <g>
            {/* Floor line */}
            <line x1={0} y1={545} x2={1280} y2={545} stroke={WHITE} strokeWidth={2.5} />
            {/* Left bedroom door */}
            <rect x={0} y={245} width={96} height={300} fill="none" stroke={WHITE} strokeWidth={2} />
            <circle cx={78} cy={405} r={4} fill={WHITE} />
            {/* Nightstand + lamp + red LED clock */}
            <rect x={148} y={440} width={118} height={105} fill="none" stroke={WHITE} strokeWidth={2} />
            <line x1={148} y1={492} x2={266} y2={492} stroke={WHITE} strokeWidth={1.6} />
            <polygon points="164,405 212,405 202,368 174,368" fill="none" stroke={WHITE} strokeWidth={2} />
            <line x1={188} y1={405} x2={188} y2={440} stroke={WHITE} strokeWidth={2} />
            <rect x={198} y={405} width={64} height={30} rx={4} fill="#080808" stroke={WHITE} strokeWidth={1.8} />
            <text x={230} y={427} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={19} fill={RED}>
              {clockText}
            </text>
            {/* 4-pane window with moon & optional dawn light beam */}
            <rect x={465} y={135} width={215} height={185} fill={spec.dawn ? "#1B2430" : "#0A0F18"} stroke={WHITE} strokeWidth={2.2} />
            <line x1={572} y1={135} x2={572} y2={320} stroke={WHITE} strokeWidth={2} />
            <line x1={465} y1={227} x2={680} y2={227} stroke={WHITE} strokeWidth={2} />
            {!spec.dawn && <circle cx={622} cy={180} r={19} fill="#DCDFE4" />}
            {spec.dawn && <polygon points="465,320 680,320 420,545 190,545" fill={`rgba(200,210,225,${dawnOp})`} />}
            {/* Right closet doors */}
            <rect x={1100} y={245} width={180} height={300} fill="none" stroke={WHITE} strokeWidth={2} />
            <line x1={1175} y1={245} x2={1175} y2={545} stroke={WHITE} strokeWidth={1.8} />
            {/* Homework sheets on floor */}
            <rect x={580} y={536} width={75} height={7} fill={GRAY_LIGHT} opacity={0.85} />
            {/* Kid & Shadow figure */}
            <KidBody x={spec.trap_box ? 965 : 535} y={525} scale={1.15} scared={spec.danger || spec.grab} />
            <ShadowMomBody x={spec.trap_box ? 780 : 770} y={515} scale={1.12} />
            {/* Elongated arm grabbing wrist */}
            {spec.grab && (
              <line
                x1={735}
                y1={420}
                x2={interpolate(armReach, [0, 1], [735, 565])}
                y2={interpolate(armReach, [0, 1], [420, 495])}
                stroke="#2A2D31"
                strokeWidth={9}
                strokeLinecap="round"
              />
            )}
            {/* Red dashed trap box */}
            {spec.trap_box && (
              <rect
                x={710}
                y={220}
                width={450}
                height={332}
                fill="none"
                stroke={RED}
                strokeWidth={3}
                strokeDasharray="10 8"
              />
            )}
            {bubble && <Bubble x={770} y={265} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "kitchen_view": {
        const steamShift = (local * 26) % 28;
        return (
          <g>
            <line x1={0} y1={545} x2={1280} y2={545} stroke={WHITE} strokeWidth={2.5} />
            {/* Hanging warm bulb */}
            <polygon points="640,120 400,545 880,545" fill="rgba(242,184,75,0.18)" />
            <polygon points="622,120 658,120 648,96 632,96" fill={AMBER} />
            {/* Counter & steaming pot */}
            <rect x={100} y={395} width={220} height={150} fill="none" stroke={WHITE} strokeWidth={2.2} />
            <rect x={225} y={358} width={86} height={36} rx={6} fill={GRAY_MID} />
            <path
              d={`M250,${348 - steamShift} Q242,${330 - steamShift} 252,${312 - steamShift}`}
              fill="none"
              stroke={GRAY_LIGHT}
              strokeWidth={2}
              opacity={0.65}
            />
            <path
              d={`M280,${342 - steamShift} Q288,${324 - steamShift} 278,${306 - steamShift}`}
              fill="none"
              stroke={GRAY_LIGHT}
              strokeWidth={2}
              opacity={0.65}
            />
            {/* Dining table & chair */}
            <line x1={535} y1={430} x2={965} y2={430} stroke={WHITE} strokeWidth={3} />
            <line x1={565} y1={430} x2={565} y2={545} stroke={WHITE} strokeWidth={2.2} />
            <line x1={935} y1={430} x2={935} y2={545} stroke={WHITE} strokeWidth={2.2} />
            <ellipse cx={640} cy={424} rx={42} ry={6} fill={GRAY_LIGHT} />
            <ellipse cx={845} cy={424} rx={42} ry={6} fill={GRAY_LIGHT} />
            <polyline points="1030,545 1030,455 1095,455 1095,545" fill="none" stroke={WHITE} strokeWidth={2.2} />
            <line x1={1095} y1={455} x2={1095} y2={365} stroke={WHITE} strokeWidth={2.2} />
            {bubble && <Bubble x={640} y={240} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "face_kid": {
        const mood = spec.mood || (spec.danger ? "scared" : "neutral");
        const eyeR = mood === "scared" || mood === "gasp" ? 19 : 13;
        return (
          <g transform="translate(640 345)">
            <circle cx={0} cy={15} r={148} fill={GRAY_LIGHT} />
            {/* Wavy hair/hat */}
            <path d="M-155,-42 C-120,-175 120,-175 155,-42 C110,-62 55,-38 0,-52 C-55,-38 -110,-62 -155,-42 Z" fill={GRAY_MID} />
            {/* Brows */}
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
            {/* Eyes */}
            <circle cx={-52} cy={-6} r={eyeR} fill={mood === "scared" || mood === "gasp" ? "#FFF" : "#111"} stroke="#111" strokeWidth={5} />
            <circle cx={52} cy={-6} r={eyeR} fill={mood === "scared" || mood === "gasp" ? "#FFF" : "#111"} stroke="#111" strokeWidth={5} />
            {(mood === "scared" || mood === "gasp") && (
              <>
                <circle cx={-52} cy={-6} r={7} fill="#111" />
                <circle cx={52} cy={-6} r={7} fill="#111" />
              </>
            )}
            {/* Tear */}
            {mood === "cry" && <path d="M-85,22 Q-98,55 -85,68 Q-72,55 -85,22 Z" fill={BLUE_TEAR} />}
            {/* Mouth */}
            {mood === "gasp" || mood === "scared" ? (
              <ellipse cx={0} cy={68} rx={18} ry={24} fill="none" stroke="#111" strokeWidth={8} />
            ) : mood === "cry" ? (
              <path d="M-38,85 Q0,48 38,85" fill="none" stroke="#111" strokeWidth={9} strokeLinecap="round" />
            ) : (
              <line x1={-36} y1={68} x2={36} y2={68} stroke="#111" strokeWidth={9} strokeLinecap="round" />
            )}
            {/* Listening sound waves */}
            {spec.sound_waves && (
              <g stroke={GRAY_MID} strokeWidth={4} fill="none" opacity={0.6 + 0.35 * Math.sin(local * 6)}>
                <path d="M185,-35 Q205,0 185,35" />
                <path d="M210,-52 Q238,0 210,52" />
              </g>
            )}
            {bubble && <Bubble x={0} y={-188} text={bubble} p={p} />}
          </g>
        );
      }

      case "face_shadow": {
        return (
          <g transform="translate(640 355)">
            <circle cx={0} cy={-160} r={44} fill="#666A70" />
            <circle cx={0} cy={0} r={158} fill="#1C1E22" stroke="#5A5E66" strokeWidth={5} />
            <path d="M-150,-55 Q0,-175 150,-55 Q0,-95 -150,-55 Z" fill="#6E7278" />
            {/* Blank shadowed face oval */}
            <ellipse cx={0} cy={18} rx={96} ry={66} fill="#34373D" opacity={0.65} />
            {bubble && <Bubble x={0} y={-205} text={bubble} dark p={p} />}
          </g>
        );
      }

      case "face_smile": {
        const smileCurve = interpolate(p, [0, 0.7], [85, 118], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const revealOp = interpolate(p, [0, 0.35], [0.35, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <g transform="translate(640 355)" opacity={revealOp}>
            <circle cx={0} cy={-160} r={44} fill="#6E7278" />
            <circle cx={0} cy={0} r={158} fill="#5C6066" stroke="#222" strokeWidth={4} />
            <path d="M-152,-52 Q0,-172 152,-52 Q0,-86 -152,-52 Z" fill="#7D8188" />
            {/* Flat brows */}
            <line x1={-82} y1={-56} x2={-32} y2={-56} stroke="#0B0B0B" strokeWidth={9} strokeLinecap="round" />
            <line x1={32} y1={-56} x2={82} y2={-56} stroke="#0B0B0B" strokeWidth={9} strokeLinecap="round" />
            {/* Wide unblinking concentric eyes */}
            <circle cx={-56} cy={-8} r={28} fill="#7E838A" stroke="#0B0B0B" strokeWidth={8} />
            <circle cx={-56} cy={-8} r={10} fill="#0B0B0B" />
            <circle cx={56} cy={-8} r={28} fill="#7E838A" stroke="#0B0B0B" strokeWidth={8} />
            <circle cx={56} cy={-8} r={10} fill="#0B0B0B" />
            {/* Uncanny wide smile */}
            <path d={`M-92,46 Q0,${smileCurve} 92,46`} fill="none" stroke="#0B0B0B" strokeWidth={9} strokeLinecap="round" />
            {bubble && <Bubble x={0} y={-205} text={bubble} p={p} />}
          </g>
        );
      }

      case "face_mom_cry": {
        const smiling = spec.mood === "smile";
        return (
          <g transform="translate(640 355)">
            <circle cx={0} cy={-158} r={42} fill={GRAY_MID} />
            <circle cx={0} cy={0} r={154} fill={GRAY_LIGHT} />
            <path d="M-148,-52 Q0,-172 148,-52 Q0,-86 -148,-52 Z" fill={GRAY_MID} />
            <line x1={-75} y1={-46} x2={-30} y2={smiling ? -46 : -56} stroke="#111" strokeWidth={9} strokeLinecap="round" />
            <line x1={30} y1={smiling ? -46 : -56} x2={75} y2={-46} stroke="#111" strokeWidth={9} strokeLinecap="round" />
            <circle cx={-52} cy={-8} r={14} fill="#111" />
            <circle cx={52} cy={-8} r={14} fill="#111" />
            {!smiling && <path d="M-86,16 Q-102,56 -86,70 Q-70,56 -86,16 Z" fill={BLUE_TEAR} />}
            {smiling ? (
              <path d="M-46,56 Q0,104 46,56" fill="none" stroke="#111" strokeWidth={9} strokeLinecap="round" />
            ) : (
              <path d="M-42,88 Q0,44 42,88" fill="none" stroke="#111" strokeWidth={9} strokeLinecap="round" />
            )}
            {bubble && <Bubble x={0} y={-202} text={bubble} p={p} />}
          </g>
        );
      }

      case "clock_countdown": {
        let display = clockText;
        if (clockText === "0:10" || clockText === "10") {
          const sec = Math.max(1, 10 - Math.floor(p * 10));
          display = `0:${String(sec).padStart(2, "0")}`;
        }
        return <LedClock x={640} y={350} text={display} scale={1.25} />;
      }

      case "notepad_rules": {
        const heading = (spec.title || "IF IT CALLS YOU").toUpperCase();
        const drawn = Math.min(7, Math.floor(p * 9) + 1);
        return (
          <g transform="translate(640 345) rotate(-1.5)">
            {/* Masking tape */}
            <rect x={-48} y={-236} width={96} height={24} fill="#C6BE98" opacity={0.85} />
            {/* Yellow lined notepad */}
            <rect x={-195} y={-222} width={390} height={455} rx={4} fill="#F3EDD2" />
            <text
              x={0}
              y={-172}
              textAnchor="middle"
              fontFamily="Georgia, serif"
              fontStyle="italic"
              fontWeight={700}
              fontSize={28}
              fill="#1E1D1A"
            >
              {heading}
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

      case "rule_dots": {
        return <RuleProgressDots cx={640} cy={355} active={6} redLast size={18} />;
      }

      case "rule_card": {
        const rn = spec.rule_num || 1;
        const is7 = rn === 7 || !!spec.danger;
        const accent = is7 ? RED : WHITE;
        const fullTitle = (spec.title || `RULE ${rn}`).toUpperCase();
        const chars = Math.max(1, Math.floor(interpolate(p, [0.08, 0.55], [0, fullTitle.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
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
              fontSize={38}
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
        const list = spec.words && spec.words.length >= 2 ? spec.words.slice(0, 3) : ["COMING", "WHAT?", "OKAY"];
        const xs = list.length === 2 ? [440, 840] : [300, 640, 980];
        return (
          <g>
            {list.map((w, i) => {
              const showAt = i * 0.28;
              const op = interpolate(p, [showAt, showAt + 0.08], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const slash = interpolate(p, [showAt + 0.08, showAt + 0.22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const textStr = `"${w.toUpperCase()}"`;
              const halfW = textStr.length * 13;
              return (
                <g key={i} opacity={op}>
                  <text
                    x={xs[i]}
                    y={360}
                    textAnchor="middle"
                    fontFamily="Montserrat, sans-serif"
                    fontWeight={800}
                    fontSize={40}
                    fill={WHITE}
                  >
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

      case "door_crack": {
        const feetOp = spec.feet ? interpolate(p, [0.15, 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
        return (
          <g>
            <line x1={0} y1={555} x2={1280} y2={555} stroke={WHITE} strokeWidth={2.5} />
            <rect x={250} y={85} width={780} height={470} fill="none" stroke={WHITE} strokeWidth={3} />
            {/* Doorknob */}
            <circle cx={965} cy={355} r={8} fill={WHITE} />
            {/* Warm amber light crack under door */}
            <rect x={252} y={546} width={776} height={9} fill={AMBER} opacity={0.85} />
            {/* Two dark shadow feet standing outside */}
            {spec.feet && (
              <g opacity={feetOp}>
                <rect x={495} y={544} width={118} height={12} rx={3} fill="#080808" />
                <rect x={665} y={544} width={118} height={12} rx={3} fill="#080808" />
              </g>
            )}
            {bubble && <Bubble x={640} y={138} text={bubble} dark p={p} />}
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
            {/* Creak acoustic wave on active step */}
            <g stroke={GRAY_MID} strokeWidth={3.5} fill="none" opacity={pulse}>
              <path d={`M${sx},${sy - 32} Q${sx + 18},${sy - 14} ${sx},${sy + 4}`} />
              <path d={`M${sx + 14},${sy - 44} Q${sx + 38},${sy - 14} ${sx + 14},${sy + 16}`} />
            </g>
          </g>
        );
      }

      case "wrist_grab": {
        const fingerLen = spec.stretch
          ? interpolate(p, [0, 0.85], [105, 225], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 105;
        return (
          <g>
            {/* White horizontal forearm & hand */}
            <rect x={0} y={332} width={770} height={46} fill="#EBEBEB" />
            <rect x={765} y={328} width={58} height={54} rx={12} fill="#EBEBEB" />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={818} y={329 + i * 11} width={44} height={7} rx={3} fill="#EBEBEB" />
            ))}
            {/* Dark palm on top */}
            <rect x={365} y={258} width={155} height={72} rx={28} fill="#2A2D32" />
            {/* 4 elongated dark fingers wrapping over & down */}
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x={405 + i * 32}
                y={312}
                width={18}
                height={fingerLen}
                rx={9}
                fill="#22252A"
                stroke="#3A3E44"
                strokeWidth={1.5}
              />
            ))}
          </g>
        );
      }

      case "lamp_reach": {
        const handX = interpolate(p, [0, 0.7], [-60, 290], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <g>
            <line x1={0} y1={560} x2={1280} y2={560} stroke={WHITE} strokeWidth={2.5} />
            {/* Nightstand */}
            <rect x={495} y={335} width={295} height={225} fill="none" stroke={WHITE} strokeWidth={3} />
            <line x1={495} y1={445} x2={790} y2={445} stroke={WHITE} strokeWidth={2.2} />
            {/* Lamp */}
            <polygon points="520,255 660,255 632,145 548,145" fill="none" stroke={WHITE} strokeWidth={3} />
            <line x1={590} y1={255} x2={590} y2={335} stroke={WHITE} strokeWidth={3} />
            {/* Red LED clock */}
            <rect x={635} y={260} width={145} height={68} rx={8} fill="#080808" stroke={WHITE} strokeWidth={2.5} />
            <text x={707} y={309} textAnchor="middle" fontFamily="Montserrat" fontWeight={800} fontSize={42} fill={RED}>
              {clockText}
            </text>
            {/* Gray hand sliding in from left */}
            <g transform={`translate(${handX} 245)`}>
              <rect x={-180} y={-24} width={260} height={54} rx={20} fill={GRAY_LIGHT} />
              <rect x={60} y={-24} width={115} height={22} rx={11} fill={GRAY_LIGHT} />
              <circle cx={68} cy={14} r={14} fill={GRAY_LIGHT} />
              <circle cx={62} cy={34} r={13} fill={GRAY_LIGHT} />
            </g>
          </g>
        );
      }

      case "hallway_figure": {
        return (
          <g>
            <line x1={0} y1={555} x2={1280} y2={555} stroke={WHITE} strokeWidth={2.5} />
            {/* Closed door on right */}
            <rect x={685} y={135} width={255} height={420} fill="none" stroke={WHITE} strokeWidth={2.8} />
            <circle cx={715} cy={355} r={7} fill={WHITE} />
            {/* Crying white figure touching the wood */}
            <ShadowMomBody x={565} y={525} scale={1.15} light />
            <polyline points="602,420 658,410 688,360" fill="none" stroke={GRAY_LIGHT} strokeWidth={9} strokeLinecap="round" />
            {bubble && <Bubble x={570} y={248} text={bubble} p={p} />}
          </g>
        );
      }

      case "window_dawn": {
        const bg = spec.dawn ? "#232B38" : "#0B111C";
        return (
          <g>
            <rect x={365} y={120} width={550} height={430} fill={bg} stroke={WHITE} strokeWidth={3} />
            <line x1={640} y1={120} x2={640} y2={550} stroke={WHITE} strokeWidth={2.5} />
            <line x1={365} y1={335} x2={915} y2={335} stroke={WHITE} strokeWidth={2.5} />
            {!spec.dawn && <circle cx={778} cy={225} r={54} fill="#E2E5EA" />}
          </g>
        );
      }

      case "flashback_scene": {
        const swim = (local * 18) % 60;
        return (
          <g>
            {/* Dark blue lake water */}
            <rect x={0} y={345} width={1280} height={210} fill="#0F1C2E" />
            <line x1={0} y1={345} x2={1280} y2={345} stroke="#2E4668" strokeWidth={2.5} />
            <line x1={0} y1={555} x2={1280} y2={555} stroke={WHITE} strokeWidth={2.5} />
            {/* Wooden pier / dock */}
            <rect x={600} y={302} width={680} height={12} fill="none" stroke={WHITE} strokeWidth={2.5} />
            <line x1={680} y1={314} x2={680} y2={555} stroke={WHITE} strokeWidth={2.5} />
            <line x1={960} y1={314} x2={960} y2={555} stroke={WHITE} strokeWidth={2.5} />
            {/* Kid sitting on dock edge */}
            <KidBody x={795} y={345} scale={0.95} />
            {/* Tiny swimming fish */}
            {[0, 1, 2].map((i) => (
              <ellipse
                key={i}
                cx={920 + i * 48 - swim}
                cy={405 + (i % 2) * 32}
                rx={14}
                ry={6}
                fill="#7D8FA6"
              />
            ))}
          </g>
        );
      }

      case "callback_text":
      default: {
        const title = (spec.title || "DON'T ANSWER").toUpperCase();
        return (
          <g>
            <text
              x={640}
              y={355}
              textAnchor="middle"
              fontFamily="Montserrat, sans-serif"
              fontWeight={800}
              fontSize={64}
              letterSpacing={3}
              fill={spec.danger ? RED : WHITE}
            >
              {title}
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
      <g
        opacity={fadeIn}
        transform={`translate(640 360) scale(${zoom}) translate(-640 -360)`}
      >
        {content}
      </g>
    </SvgLayer>
  );
};

export const RenderStyle5Overlay: React.FC<P> = () => null;
