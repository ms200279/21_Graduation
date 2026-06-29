"use client";

import { CSSProperties } from "react";

type LandingScrollBackgroundProps = {
  src: string;
  /** Number of full-page snap sections (default 3 = hero + index + concept). */
  sections?: number;
  className?: string;
};

/**
 * Scroll-aligned landing background.
 *
 * Spans the full snap-scroll height so each section reveals a different
 * vertical slice of the image as the user scrolls. Sits behind jellyfish
 * (z-index 0) with cover + center for responsive cropping.
 */
export default function LandingScrollBackground({
  src,
  sections = 3,
  className = "",
}: LandingScrollBackgroundProps) {
  const layerStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: `${sections * 100}dvh`,
    zIndex: 0,
    pointerEvents: "none",
    backgroundImage: `url("${src}")`,
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <div
      className={`landing-scroll-bg ${className}`.trim()}
      style={layerStyle}
      aria-hidden="true"
    />
  );
}
