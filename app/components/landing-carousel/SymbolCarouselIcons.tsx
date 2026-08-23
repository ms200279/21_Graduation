"use client";

import { memo, useId } from "react";
import type { SymbolHeadingVariant } from "./slides";

const SYMBOL_PATHS = [
  "M98.97,289c0,5.52-4.48,10-10,10h-5.55c-5.52,0-10-4.48-10-10v-86c0-5.52-4.48-10-10-10h-13c-4.97,0-9-4.03-9-9s4.03-9,9-9h13c5.52,0,10-4.48,10-10v-19c0-5.52,4.48-10,10-10h5.55c5.52,0,10,4.48,10,10v19c0,5.52-4.48,10-10,10h-1c-4.97,0-9,4.03-9,9s4.03,9,9,9h1c5.52,0,10,4.48,10,10v86Z",
  "M98.97,19c0,5.52-4.48,10-10,10h-1c-4.97,0-9,4.03-9,9s4.03,9,9,9h1c5.52,0,10,4.48,10,10v33c0,5.52-4.48,10-10,10h-5.55c-5.52,0-10-4.48-10-10v-33c0-5.52-4.48-10-10-10h-28c-5.52,0-10,4.48-10,10v108c0,5.52-4.48,10-10,10h-5.43c-5.52,0-10-4.48-10-10V10C0,4.48,4.48,0,10,0h5.43c5.52,0,10,4.48,10,10v9c0,5.52,4.48,10,10,10h28c5.52,0,10-4.48,10-10v-9c0-5.52,4.48-10,10-10h5.55c5.52,0,10,4.48,10,10v9Z",
  "M176.94,239c0,5.52-4.48,10-10,10h-5.52c-5.52,0-10-4.48-10-10v-36c0-5.52-4.48-10-10-10h-13c-4.97,0-9-4.03-9-9s4.03-9,9-9h13c5.52,0,10-4.48,10-10v-76c0-5.52,4.48-10,10-10h5.52c5.52,0,10,4.48,10,10v76c0,5.52-4.48,10-10,10h-1c-4.97,0-9,4.03-9,9s4.03,9,9,9h1c5.52,0,10,4.48,10,10v36Z",
] as const;

const SYMBOL_VIEWBOX = "0 0 176.94 299";

type SymbolPathsProps = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

function SymbolPaths({ fill, stroke, strokeWidth }: SymbolPathsProps) {
  return (
    <>
      {SYMBOL_PATHS.map((path) => (
        <path
          key={path}
          d={path}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ))}
      <rect
        x="151.22"
        y="0"
        width="25.72"
        height="52"
        rx="10"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </>
  );
}

function getSymbolStyles(variant: SymbolHeadingVariant) {
  if (variant === "navy") {
    return {
      fill: "var(--color-systemNavy)",
      stroke: "none",
      strokeWidth: 0,
    };
  }

  return {
    fill: "var(--color-systemBlack)",
    stroke: "none",
    strokeWidth: 0,
  };
}

function OutlinedSymbolIcon() {
  const clipId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox={SYMBOL_VIEWBOX}
      className="landing-carousel__slide-symbol"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <SymbolPaths />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <SymbolPaths fill="#ffffff" />
        <SymbolPaths
          fill="none"
          stroke="var(--color-systemBlack)"
          strokeWidth={12}
        />
      </g>
    </svg>
  );
}

type SymbolCarouselIconsProps = {
  variants: SymbolHeadingVariant[];
};

function SymbolCarouselIcons({ variants }: SymbolCarouselIconsProps) {
  return (
    <div className="landing-carousel__slide-heading-symbols" aria-hidden="true">
      {variants.map((variant) => {
        if (variant === "outlined") {
          return <OutlinedSymbolIcon key={variant} />;
        }

        const styles = getSymbolStyles(variant);

        return (
          <svg
            key={variant}
            viewBox={SYMBOL_VIEWBOX}
            className="landing-carousel__slide-symbol"
            role="img"
            aria-hidden="true"
          >
            <SymbolPaths
              fill={styles.fill}
              stroke={styles.stroke}
              strokeWidth={styles.strokeWidth}
            />
          </svg>
        );
      })}
    </div>
  );
}

export default memo(SymbolCarouselIcons);
