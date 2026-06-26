"use client";

import {
  CSSProperties,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { getDisplacementFilter } from "./liquidGlassFilter";

type GlassColor = "black" | "white" | "transparent";

interface LiquidGlassProps {
  children?: ReactNode;
  className?: string;
  blur?: number;
  depth?: number;
  strength?: number;
  radius?: number;
  chromaticAberration?: number;
  saturate?: number;
  brightness?: number;
  color?: GlassColor;
}

const GLASS_BACKGROUND: Record<GlassColor, string> = {
  black: "#09090b80",
  white: "#fafafa80",
  transparent: "#09090b00",
};

function supportsBackdropFilterUrl() {
  if (typeof document === "undefined") return false;
  const testEl = document.createElement("div");
  testEl.style.cssText = "backdrop-filter: url(#test)";
  return (
    testEl.style.backdropFilter === "url(#test)" ||
    testEl.style.backdropFilter === 'url("#test")'
  );
}

export default function LiquidGlass({
  children,
  className = "",
  blur = 0,
  depth = 10,
  strength = 100,
  radius = 0,
  chromaticAberration = 0,
  saturate = 1,
  brightness = 1,
  color = "transparent",
}: LiquidGlassProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    const filterEl = filterRef.current;
    if (!content || !filterEl) return;

    const canUseUrlFilter = supportsBackdropFilterUrl();

    const applyFilter = (value: string) => {
      filterEl.style.backdropFilter = value;
      filterEl.style.setProperty("-webkit-backdrop-filter", value);
    };

    const redraw = () => {
      const width = Math.round(content.offsetWidth);
      const height = Math.round(content.offsetHeight);
      if (width === 0 || height === 0) return;

      filterEl.style.width = `${width}px`;
      filterEl.style.height = `${height}px`;

      if (canUseUrlFilter) {
        const displacement = getDisplacementFilter({
          width,
          height,
          radius,
          depth,
          strength,
          chromaticAberration,
        });

        applyFilter(
          `blur(${blur / 2}px) url('${displacement}') blur(${blur}px) brightness(${brightness}) saturate(${saturate})`,
        );
      } else {
        applyFilter(`blur(${width / 10}px)`);
      }
    };

    redraw();

    const observer = new ResizeObserver(redraw);
    observer.observe(content);

    return () => observer.disconnect();
  }, [blur, depth, strength, radius, chromaticAberration, saturate, brightness]);

  const wrapperStyle: CSSProperties = {
    borderRadius: radius ? `${radius}px` : undefined,
  };

  const filterStyle: CSSProperties = {
    borderRadius: radius ? `${radius}px` : undefined,
    background: GLASS_BACKGROUND[color],
    boxShadow: "inset 0 0 4px 0 #fafafa38",
    ...(color === "black" ? { filter: "brightness(0.6)" } : null),
  };

  return (
    <div
      className={`liquid-glass relative w-max overflow-hidden ${className}`}
      style={wrapperStyle}
    >
      <div
        ref={contentRef}
        className="lg-content relative z-[3] flex w-full items-center justify-center text-center"
      >
        {children}
      </div>
      <div
        ref={filterRef}
        aria-hidden="true"
        className="lg-filter-layer pointer-events-none absolute inset-0 z-[2]"
        style={filterStyle}
      />
    </div>
  );
}
