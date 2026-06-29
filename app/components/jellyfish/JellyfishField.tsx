"use client";

import { CSSProperties } from "react";
import JellyfishItem, { JellyfishConfig } from "./JellyfishItem";

/** Total landing scroll height in sections (hero + index + concept). */
export const JELLYFISH_STAGE_SECTIONS = 3;

const STAGE_STYLE: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: `${JELLYFISH_STAGE_SECTIONS * 100}dvh`,
  zIndex: 1,
  overflow: "visible",
  pointerEvents: "none",
};

export type JellyfishFieldProps = {
  jellyfishes: JellyfishConfig[];
  className?: string;
};

/**
 * One shared scroll-height stage for all jellyfish.
 * initialY is a % of this total height (0% = top, 100% = bottom).
 */
export default function JellyfishField({
  jellyfishes,
  className = "",
}: JellyfishFieldProps) {
  return (
    <div
      className={`jf-field ${className}`.trim()}
      style={STAGE_STYLE}
      aria-hidden="true"
    >
      {jellyfishes.map((jellyfish, index) => (
        <JellyfishItem
          key={`${jellyfish.imageSrc}-${index}`}
          {...jellyfish}
        />
      ))}
    </div>
  );
}
