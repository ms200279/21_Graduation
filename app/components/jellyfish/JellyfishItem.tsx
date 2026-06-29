"use client";

import { CSSProperties, useRef } from "react";
import { useJellyfishMotion, anchorProgressFromY } from "./useJellyfishMotion";

export type JellyfishVariant =
  | "disk"
  | "main"
  | "background"
  | "tentacle"
  | "foreground";

export type JellyfishConfig = {
  imageSrc: string;
  /** Horizontal anchor, e.g. "50%" or "120px". Centered on this point. */
  initialX: string;
  /** Vertical anchor, e.g. "46%". Centered on this point. */
  initialY: string;
  /** Rendered width in px (height keeps the image aspect ratio). */
  size: number;
  /** Parallax depth → scroll travel amount. */
  depth: number;
  /** Extra multiplier on the scroll travel. */
  speedMultiplier?: number;
  /** Motion personality. */
  variant?: JellyfishVariant;
  /** Override the resting opacity. */
  opacity?: number;
  /** Extra image blur in px (added on top of the base 0.2px). */
  blur?: number;
};

/** Allow CSS custom properties in inline styles. */
type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

type Preset = {
  floatDur: number;
  driftX: number;
  driftY: number;
  rot: number;
  pulseDur: number;
  pulseX: number;
  pulseY: number;
  propulsion: number;
  opacity: number;
  opacityPulse: boolean;
  opacityMin: number;
  opacityMax: number;
  maxTravelY: number;
  maxTravelX: number;
  maxRotate: number;
};

const PRESETS: Record<JellyfishVariant, Preset> = {
  // Front-on disk jellyfish: dreamy, space-float feel.
  disk: {
    floatDur: 9,
    driftX: 12,
    driftY: 18,
    rot: 4,
    pulseDur: 2.5,
    pulseX: 1.04,
    pulseY: 0.94,
    propulsion: -8,
    opacity: 0.96,
    opacityPulse: false,
    opacityMin: 0.85,
    opacityMax: 1,
    maxTravelY: 700,
    maxTravelX: 180,
    maxRotate: 16,
  },
  // Main landing jellyfish: living-aquarium contraction.
  main: {
    floatDur: 8,
    driftX: 10,
    driftY: 16,
    rot: 3,
    pulseDur: 2.8,
    pulseX: 1.05,
    pulseY: 0.92,
    propulsion: -18,
    opacity: 1,
    opacityPulse: false,
    opacityMin: 0.9,
    opacityMax: 1,
    maxTravelY: 780,
    maxTravelX: 180,
    maxRotate: 16,
  },
  // Small, far jellyfish: strong parallax, opacity breathing.
  background: {
    floatDur: 13,
    driftX: 9,
    driftY: 15,
    rot: 3,
    pulseDur: 6,
    pulseX: 1.01,
    pulseY: 0.99,
    propulsion: 0,
    opacity: 0.82,
    opacityPulse: true,
    opacityMin: 0.72,
    opacityMax: 0.9,
    maxTravelY: 980,
    maxTravelX: 160,
    maxRotate: 14,
  },
  // Long-tentacle jellyfish: slower, trailing feel.
  tentacle: {
    floatDur: 7,
    driftX: 11,
    driftY: 18,
    rot: 4,
    pulseDur: 3,
    pulseX: 1.02,
    pulseY: 0.95,
    propulsion: -10,
    opacity: 0.95,
    opacityPulse: false,
    opacityMin: 0.85,
    opacityMax: 1,
    maxTravelY: 780,
    maxTravelX: 180,
    maxRotate: 16,
  },
  // Foreground jellyfish: large, close to camera, big movement.
  foreground: {
    floatDur: 6,
    driftX: 16,
    driftY: 22,
    rot: 4,
    pulseDur: 3.2,
    pulseX: 1.03,
    pulseY: 0.97,
    propulsion: -12,
    opacity: 1,
    opacityPulse: false,
    opacityMin: 0.9,
    opacityMax: 1,
    maxTravelY: 1240,
    maxTravelX: 280,
    maxRotate: 18,
  },
};

/** Deterministic [0, 1) from a string so SSR and CSR match. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export default function JellyfishItem({
  imageSrc,
  initialX,
  initialY,
  size,
  depth,
  speedMultiplier = 1,
  variant = "main",
  opacity,
  blur = 0,
}: JellyfishConfig) {
  const motionRef = useRef<HTMLDivElement>(null);
  const preset = PRESETS[variant];

  useJellyfishMotion(motionRef, {
    depth,
    speedMultiplier,
    anchorProgress: anchorProgressFromY(initialY),
    maxTravelY: preset.maxTravelY,
    maxTravelX: preset.maxTravelX,
    maxRotate: preset.maxRotate,
  });

  const r1 = seeded(`${imageSrc}|${initialX}|${initialY}`);
  const r2 = seeded(`${imageSrc}|${initialY}|${initialX}|pulse`);

  const floatDelay = -(r1 * preset.floatDur);
  const pulseDelay = -(r2 * preset.pulseDur);
  const restOpacity = opacity ?? preset.opacity;

  // Structural styles are inlined so layout never depends on a global
  // stylesheet load. Only @keyframes (jf-float/jf-pulse/jf-opacity) live in CSS.
  const wrapperStyle: CSSProperties = {
    position: "absolute",
    left: initialX,
    top: initialY,
    width: size,
    transform: "translate(-50%, -50%)",
  };

  const motionStyle: CSSProperties = {
    willChange: "transform",
  };

  const floatStyle: CSSVars = {
    "--jf-x": preset.driftX,
    "--jf-y": preset.driftY,
    "--jf-rot": preset.rot,
    willChange: "transform",
    animation: `jf-float ${preset.floatDur}s ease-in-out ${floatDelay}s infinite`,
  };

  const pulseStyle: CSSVars = {
    "--jf-pulse-x": preset.pulseX,
    "--jf-pulse-y": preset.pulseY,
    "--jf-propulsion": `${preset.propulsion}px`,
    transformOrigin: "50% 30%",
    willChange: "transform",
    animation: `jf-pulse ${preset.pulseDur}s ease-in-out ${pulseDelay}s infinite`,
  };

  const imgStyle: CSSVars = {
    display: "block",
    width: "100%",
    height: "auto",
    opacity: restOpacity,
    filter: `blur(${0.2 + blur}px) brightness(1.04) drop-shadow(0 20px 80px rgba(180, 210, 255, 0.18))`,
    userSelect: "none",
    "--jf-opacity-min": preset.opacityMin,
    "--jf-opacity-max": preset.opacityMax,
    ...(preset.opacityPulse
      ? {
          animation: `jf-opacity ${preset.floatDur}s ease-in-out ${floatDelay}s infinite`,
        }
      : {}),
  };

  return (
    <div className="jf-wrapper" style={wrapperStyle}>
      <div ref={motionRef} className="jf-motion" style={motionStyle}>
        <div className="jf-float" style={floatStyle}>
          <div className="jf-pulse" style={pulseStyle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              className={`jf-img${
                preset.opacityPulse ? " jf-img--pulse-opacity" : ""
              }`}
              style={imgStyle}
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
