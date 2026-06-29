"use client";

import { CSSProperties } from "react";
import JellyfishItem, {
  JellyfishConfig,
  JellyfishVariant,
} from "./JellyfishItem";

// Structural styles are inlined (not relying on a global stylesheet).
// The stage spans the full landing scroll height (3 sections = 300dvh) and
// scrolls with the content, so jellyfish are distributed across the whole
// scroll rather than pinned to the first viewport. Positions (initialY) are
// percentages of this total height. overflow:hidden clips horizontal spill so
// no extra scrollbar appears.
const LAYER_STYLE: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "300dvh",
  zIndex: 0,
  overflow: "hidden",
  pointerEvents: "none",
};

export type JellyfishLayerProps = Partial<
  Pick<
    JellyfishConfig,
    "initialX" | "initialY" | "variant" | "speedMultiplier" | "opacity"
  >
> & {
  imageSrc: string;
  depth: number;
  size: number;
  className?: string;
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

/** Pick a motion personality from depth when none is provided. */
function defaultVariant(depth: number): JellyfishVariant {
  if (depth >= 1.8) return "foreground";
  if (depth >= 1.3) return "main";
  if (depth >= 1.0) return "disk";
  if (depth >= 0.7) return "tentacle";
  return "background";
}

/**
 * A single jellyfish on its own fixed, full-viewport, decorative stage.
 *
 * Render several side by side to build the field:
 *   <JellyfishLayer imageSrc="/images/jellyfish/1.png" depth={0.8} size={420} />
 *
 * If initialX/initialY/variant are omitted, sensible defaults are derived
 * (deterministic spread by imageSrc, variant by depth).
 */
export default function JellyfishLayer({
  imageSrc,
  depth,
  size,
  initialX,
  initialY,
  variant,
  speedMultiplier,
  opacity,
  className = "",
}: JellyfishLayerProps) {
  const resolvedX = initialX ?? `${Math.round(15 + seeded(`${imageSrc}|x`) * 70)}%`;
  const resolvedY = initialY ?? `${Math.round(20 + seeded(`${imageSrc}|y`) * 60)}%`;
  const resolvedVariant = variant ?? defaultVariant(depth);

  return (
    <div
      className={`jf-layer ${className}`.trim()}
      style={LAYER_STYLE}
      aria-hidden="true"
    >
      <JellyfishItem
        imageSrc={imageSrc}
        initialX={resolvedX}
        initialY={resolvedY}
        size={size}
        depth={depth}
        speedMultiplier={speedMultiplier}
        variant={resolvedVariant}
        opacity={opacity}
      />
    </div>
  );
}
