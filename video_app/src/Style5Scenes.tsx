import React from "react";
import { interpolate } from "remotion";
import { SvgLayer, SpeechPair, RuleCard } from "./kit";

export type SceneSpec = {
  id: string;
  word_start: number;
  scene:
    | "rule_card"
    | "big_word"
    | "phone_call"
    | "phone_text"
    | "phone_clock"
    | "phone_map"
    | "room_doorway"
    | "room_bed"
    | "room_couch"
    | "room_pet"
    | "entity_grin"
    | "rewind_clue";
  rule_num?: number;
  title?: string;
  subtitle?: string;
  normal_bubble?: string;
  echo_bubble?: string;
  danger?: boolean;
  sfx?: string;
};

type P = { spec: SceneSpec; local: number; p: number; len: number };

const Glow: React.FC<{ cx?: number; cy?: number; r?: number; color?: string }> = ({
  cx = 640,
  cy = 360,
  r = 340,
  color = "rgba(255,255,255,0.13)",
}) => (
  <>
    <defs>
      <radialGradient id="s5glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
    </defs>
    <circle cx={cx} cy={cy} r={r} fill="url(#s5glow)" />
  </>
);

const Person: React.FC<{
  x: number;
  y: number;
  scale?: number;
  scared?: boolean;
  smile?: boolean;
  tall?: boolean;
  yellowEyes?: boolean;
  local: number;
}> = ({ x, y, scale = 1, scared, smile, tall, yellowEyes, local }) => {
  const bob = Math.sin(local * 2.2) * 3;
  const h = tall ? 195 : 150;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${scale})`} stroke="#ffffff" strokeWidth={5} fill="#c8c8c8">
      <rect x={-34} y={-h} width={68} height={h} rx={30} />
      <circle cx={0} cy={-h - 42} r={42} />
      {yellowEyes ? (
        <>
          <circle cx={-15} cy={-h - 48} r={7} fill="#ffe84d" stroke="none" />
          <circle cx={15} cy={-h - 48} r={7} fill="#ffe84d" stroke="none" />
          <path d={`M -26 ${-h - 28} Q 0 ${-h - 2} 26 ${-h - 28} Z`} fill="#ffffff" stroke="#111" strokeWidth={3} />
        </>
      ) : (
        <>
          <circle cx={-14} cy={-h - 45} r={scared ? 6 : 4.5} fill="#111" stroke="none" />
          <circle cx={14} cy={-h - 45} r={scared ? 6 : 4.5} fill="#111" stroke="none" />
          {scared && <ellipse cx={0} cy={-h - 25} rx={8} ry={10} fill="#111" stroke="none" />}
          {smile && <path d={`M -16 ${-h - 28} Q 0 ${-h - 14} 16 ${-h - 28}`} fill="none" stroke="#111" strokeWidth={4} />}
          {scared && (
            <path d={`M 48 ${-h - 70} Q 56 ${-h - 54} 48 ${-h - 48} Q 40 ${-h - 54} 48 ${-h - 70}`} fill="#9ecbff" stroke="none" />
          )}
        </>
      )}
    </g>
  );
};

const PhoneShell: React.FC<{ local: number; children: React.ReactNode }> = ({ local, children }) => {
  const sc = interpolate(local, [0, 5], [0.96, 1.03], { extrapolateRight: "clamp" });
  return (
    <SvgLayer>
      <Glow cx={640} cy={350} r={320} color="rgba(255,255,255,0.16)" />
      <g transform={`translate(640 350) scale(${sc}) translate(-155 -255)`}>
        <rect x={0} y={0} width={310} height={510} rx={36} fill="#0e0e12" stroke="#ffffff" strokeWidth={6} />
        <rect x={115} y={16} width={80} height={10} rx={5} fill="#2b2b34" />
        {children}
      </g>
    </SvgLayer>
  );
};

export const RenderStyle5Scene: React.FC<P> = ({ spec, local, p, len }) => {
  const drift = interpolate(p, [0, 1], [1.0, 1.05]);
  const title = (spec.title || "").toUpperCase();
  const sub = spec.subtitle || "";

  switch (spec.scene) {
    case "rule_card":
      return <RuleCard variant="boxed" n={spec.rule_num || 1} title={spec.title || "DO NOT LOOK BACK"} local={local} />;

    case "big_word":
      return (
        <SvgLayer>
          <Glow cx={640} cy={360} r={380} color={spec.danger ? "rgba(200,20,20,0.22)" : "rgba(255,255,255,0.12)"} />
          <g transform={`translate(640 360) scale(${drift})`}>
            <text
              textAnchor="middle"
              y={10}
              fill={spec.danger ? "#ff4444" : "#ffffff"}
              fontFamily="Montserrat, sans-serif"
              fontWeight={800}
              fontSize={72}
              letterSpacing={4}
            >
              {title || "DON'T MOVE."}
            </text>
            {sub && (
              <text textAnchor="middle" y={72} fill="#aaaaaa" fontFamily="Montserrat, sans-serif" fontWeight={600} fontSize={28}>
                {sub}
              </text>
            )}
          </g>
        </SvgLayer>
      );

    case "phone_call": {
      const pulse = 1 + Math.sin(local * 8) * 0.08;
      return (
        <PhoneShell local={local}>
          <text x={155} y={85} textAnchor="middle" fill="#888" fontFamily="Montserrat" fontSize={18} letterSpacing={2}>
            INCOMING CALL
          </text>
          <text x={155} y={135} textAnchor="middle" fill="#fff" fontFamily="Montserrat" fontWeight={800} fontSize={36}>
            {spec.title || "DAD"}
          </text>
          <text x={155} y={168} textAnchor="middle" fill="#ff5555" fontFamily="Montserrat" fontSize={18}>
            {sub || "3:03 AM · INSIDE HOUSE"}
          </text>
          <g transform={`translate(155 275) scale(${pulse})`}>
            <circle cx={0} cy={0} r={62} fill="#1f1f28" stroke="#ffffff" strokeWidth={4} />
            <circle cx={-16} cy={-8} r={5} fill="#ffe84d" />
            <circle cx={16} cy={-8} r={5} fill="#ffe84d" />
            <path d="M -22 14 Q 0 34 22 14" fill="none" stroke="#fff" strokeWidth={4} />
          </g>
          <circle cx={85} cy={430} r={34} fill="#cc2222" />
          <circle cx={225} cy={430} r={34} fill="#22aa44" />
        </PhoneShell>
      );
    }

    case "phone_text":
      return (
        <PhoneShell local={local}>
          <text x={155} y={66} textAnchor="middle" fill="#fff" fontFamily="Montserrat" fontWeight={700} fontSize={22}>
            {spec.title || "MESSAGES"}
          </text>
          <line x1={20} y1={84} x2={290} y2={84} stroke="#333" strokeWidth={2} />
          <rect x={24} y={115} width={220} height={68} rx={18} fill="#2a2a33" />
          <text x={40} y={156} fill="#ffffff" fontFamily="Montserrat" fontSize={18}>
            {(spec.normal_bubble || "Are you awake?").slice(0, 24)}
          </text>
          {local > 0.7 && (
            <>
              <rect x={66} y={210} width={220} height={68} rx={18} fill="#441212" stroke="#ff4444" strokeWidth={2} />
              <text x={82} y={251} fill="#ff6666" fontFamily="Courier New, monospace" fontWeight={700} fontSize={18}>
                {(spec.echo_bubble || "Don't look outside.").slice(0, 24)}
              </text>
            </>
          )}
          <text x={155} y={465} textAnchor="middle" fill="#777" fontFamily="Montserrat" fontSize={16}>
            {sub || "Delivered · 3:33 AM"}
          </text>
        </PhoneShell>
      );

    case "phone_clock":
      return (
        <PhoneShell local={local}>
          <text x={155} y={230} textAnchor="middle" fill="#ff3333" fontFamily="Courier New, monospace" fontWeight={800} fontSize={78}>
            {spec.title || "3:33"}
          </text>
          <text x={155} y={285} textAnchor="middle" fill="#cccccc" fontFamily="Montserrat" fontSize={20} letterSpacing={2}>
            {sub || "DO NOT TURN OFF"}
          </text>
        </PhoneShell>
      );

    case "phone_map": {
      const r = 18 + (local * 22) % 34;
      return (
        <PhoneShell local={local}>
          <text x={155} y={66} textAnchor="middle" fill="#fff" fontFamily="Montserrat" fontWeight={700} fontSize={20}>
            {spec.title || "FIND MY · LIVE"}
          </text>
          <rect x={20} y={88} width={270} height={330} rx={16} fill="#141821" stroke="#334" strokeWidth={2} />
          <line x1={20} y1={220} x2={290} y2={220} stroke="#263042" strokeWidth={8} />
          <line x1={155} y1={88} x2={155} y2={418} stroke="#263042" strokeWidth={8} />
          <circle cx={155} cy={220} r={r} fill="rgba(255,60,60,0.22)" />
          <circle cx={155} cy={220} r={14} fill="#ff3b3b" stroke="#ffffff" strokeWidth={3} />
          <text x={155} y={456} textAnchor="middle" fill="#ff6666" fontFamily="Montserrat" fontWeight={700} fontSize={18}>
            {sub || "ME · AT HOME · NOW"}
          </text>
        </PhoneShell>
      );
    }

    case "room_bed":
      return (
        <SvgLayer>
          <Glow cx={640} cy={420} r={420} color="rgba(255,210,120,0.09)" />
          <g transform={`translate(640 360) scale(${drift}) translate(-640 -360)`}>
            {/* Night window + moon */}
            <rect x={210} y={110} width={220} height={210} fill="#0a0c14" stroke="#ffffff" strokeWidth={4} />
            <line x1={320} y1={110} x2={320} y2={320} stroke="#ffffff" strokeWidth={3} />
            <line x1={210} y1={215} x2={430} y2={215} stroke="#ffffff" strokeWidth={3} />
            <circle cx={275} cy={165} r={24} fill="#fff6cc" />
            {/* Floor + Bed */}
            <line x1={0} y1={580} x2={1280} y2={580} stroke="#ffffff" strokeWidth={4} />
            <rect x={260} y={470} width={440} height={110} rx={12} fill="#18181f" stroke="#ffffff" strokeWidth={5} />
            <rect x={280} y={430} width={110} height={45} rx={16} fill="#dcdcdc" stroke="#ffffff" strokeWidth={4} />
            {/* Wide-eyed person in bed */}
            <circle cx={350} cy={430} r={34} fill="#cfcfcf" stroke="#ffffff" strokeWidth={4} />
            <circle cx={340} cy={426} r={5} fill="#111" />
            <circle cx={362} cy={426} r={5} fill="#111" />
            {/* Tall doorway + looming silhouette */}
            <rect x={920} y={180} width={190} height={400} fill="#0e0e14" stroke="#ffffff" strokeWidth={5} />
            <Person x={1015} y={576} tall yellowEyes={!!spec.danger} smile={!spec.danger} local={local} />
          </g>
        </SvgLayer>
      );

    case "room_couch":
      return (
        <SvgLayer>
          <Glow cx={980} cy={360} r={340} color="rgba(255,195,90,0.16)" />
          <g transform={`translate(640 360) scale(${drift}) translate(-640 -360)`}>
            <line x1={0} y1={580} x2={1280} y2={580} stroke="#ffffff" strokeWidth={4} />
            {/* Lamp with warm amber glow */}
            <line x1={980} y1={260} x2={980} y2={580} stroke="#ffffff" strokeWidth={5} />
            <polygon points="935,260 1025,260 1005,195 955,195" fill="#ffd278" stroke="#ffffff" strokeWidth={4} />
            {/* Sofa */}
            <rect x={280} y={420} width={460} height={160} rx={22} fill="#1b1b22" stroke="#ffffff" strokeWidth={5} />
            <Person x={420} y={540} scared={!!spec.danger} local={local} />
            <Person x={610} y={540} smile={!spec.danger} yellowEyes={!!spec.danger} local={local} />
          </g>
        </SvgLayer>
      );

    case "room_pet":
      return (
        <SvgLayer>
          <Glow cx={640} cy={420} r={380} color="rgba(255,255,255,0.12)" />
          <g transform={`translate(640 360) scale(${drift}) translate(-640 -360)`}>
            <line x1={0} y1={580} x2={1280} y2={580} stroke="#ffffff" strokeWidth={4} />
            <Person x={400} y={580} scared local={local} />
            {/* Line-art dog/cat figure */}
            <g transform="translate(820 580)" stroke="#ffffff" strokeWidth={5} fill="#c8c8c8">
              <rect x={-32} y={-135} width={64} height={135} rx={26} />
              <circle cx={0} cy={-165} r={36} />
              <polygon points="-28,-192 -12,-232 -2,-196" />
              <polygon points="28,-192 12,-232 2,-196" />
              <circle cx={-12} cy={-168} r={6} fill={spec.danger ? "#ff3b3b" : "#ffe84d"} stroke="none" />
              <circle cx={12} cy={-168} r={6} fill={spec.danger ? "#ff3b3b" : "#ffe84d"} stroke="none" />
            </g>
          </g>
        </SvgLayer>
      );

    case "entity_grin": {
      const z = interpolate(p, [0, 1], [1.1, 1.45]);
      return (
        <SvgLayer>
          <Glow cx={640} cy={360} r={420} color="rgba(180,20,20,0.28)" />
          <g transform={`translate(640 440) scale(${z})`}>
            <Person x={0} y={240} scale={1.5} tall yellowEyes local={local} />
          </g>
        </SvgLayer>
      );
    }

    case "rewind_clue":
      return (
        <SvgLayer>
          <Glow cx={640} cy={360} r={340} color="rgba(255,255,255,0.12)" />
          <text x={640} y={320} textAnchor="middle" fill="#ffffff" fontFamily="Montserrat" fontWeight={800} fontSize={84}>
            ◀◀
          </text>
          <text x={640} y={405} textAnchor="middle" fill="#ffffff" fontFamily="Montserrat" fontWeight={700} fontSize={40}>
            {title || "GO BACK AND CHECK."}
          </text>
        </SvgLayer>
      );

    case "room_doorway":
    default:
      return (
        <SvgLayer>
          <Glow cx={840} cy={360} r={380} color="rgba(255,210,120,0.12)" />
          <g transform={`translate(640 360) scale(${drift}) translate(-640 -360)`}>
            <line x1={0} y1={580} x2={1280} y2={580} stroke="#ffffff" strokeWidth={4} />
            <rect x={760} y={150} width={220} height={430} fill="#121218" stroke="#ffffff" strokeWidth={5} />
            <Person x={430} y={580} scared={!!spec.danger} local={local} />
            <Person x={870} y={580} tall={!!spec.danger} yellowEyes={!!spec.danger} smile={!spec.danger} local={local} />
          </g>
        </SvgLayer>
      );
  }
};

export const RenderStyle5Overlay: React.FC<P> = ({ spec, local }) => {
  if (spec.normal_bubble && spec.echo_bubble) {
    return <SpeechPair x={540} y={170} normal={spec.normal_bubble} echo={spec.echo_bubble} local={local} />;
  }
  return null;
};
