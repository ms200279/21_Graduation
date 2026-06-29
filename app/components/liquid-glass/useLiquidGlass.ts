"use client";

import { useEffect, type RefObject } from "react";
import { getDisplacementFilter } from "./liquidGlassFilter";

export interface UseLiquidGlassOptions {
  blur?: number;
  depth?: number;
  strength?: number;
  chromaticAberration?: number;
  saturate?: number;
  brightness?: number;
  /** Force a corner radius; otherwise the element's computed border-radius is used. */
  radius?: number;
  /** When false, clears the backdrop filter and skips displacement updates. */
  enabled?: boolean;
  /** Re-bind when the host element moves in the DOM (e.g. React portal). */
  mountKey?: string | number | boolean;
  /** Keep displacement maps in sync during width/height CSS transitions. */
  redrawDuringSizeTransition?: boolean;
}

const SIZE_TRANSITION_PROPERTIES = new Set([
  "width",
  "height",
  "padding",
  "padding-left",
  "padding-right",
  "padding-top",
  "padding-bottom",
]);

/** Throttle displacement regen during CSS size morphs (motion path only). */
const MOTION_SIZE_QUANTUM = 24;
const MOTION_REDRAW_INTERVAL_MS = 40;

function quantizeMotionSize(value: number) {
  return Math.max(
    1,
    Math.round(value / MOTION_SIZE_QUANTUM) * MOTION_SIZE_QUANTUM,
  );
}

let canUseUrlFilter: boolean | null = null;

function getCanUseUrlFilter() {
  if (canUseUrlFilter !== null) {
    return canUseUrlFilter;
  }

  if (typeof document === "undefined") {
    canUseUrlFilter = false;
    return canUseUrlFilter;
  }

  const testEl = document.createElement("div");
  testEl.style.cssText = "backdrop-filter: url(#test)";
  canUseUrlFilter =
    testEl.style.backdropFilter === "url(#test)" ||
    testEl.style.backdropFilter === 'url("#test")';

  return canUseUrlFilter;
}

function clearBackdropFilter(el: HTMLElement) {
  el.style.backdropFilter = "";
  el.style.removeProperty("-webkit-backdrop-filter");
}

function getFilterDimensions(el: HTMLElement) {
  // Layout size (pre-transform). getBoundingClientRect() returns post-transform
  // visual size and breaks displacement maps when an ancestor uses scale().
  return {
    width: Math.round(el.offsetWidth),
    height: Math.round(el.offsetHeight),
  };
}

/**
 * Applies the cloned liquid-glass displacement backdrop-filter to an existing
 * element (kept faithful to the cloned repo's getDisplacementFilter util).
 *
 * Works on animated elements: the corner radius is read from the element's
 * computed style on every ResizeObserver tick, so it follows shape/size
 * morphs without touching the host's animation or routing logic.
 */
export function useLiquidGlass(
  ref: RefObject<HTMLElement | null>,
  {
    blur = 0,
    depth = 10,
    strength = 100,
    chromaticAberration = 0,
    saturate = 1,
    brightness = 1,
    radius,
    enabled = true,
    mountKey,
    redrawDuringSizeTransition = false,
  }: UseLiquidGlassOptions = {},
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!enabled) {
      clearBackdropFilter(el);
      return;
    }

    const supportsUrlFilter = getCanUseUrlFilter();

    let lastWidth = -1;
    let lastHeight = -1;
    let lastRadius = -1;
    let lastBackdropValue = "";
    let sizeTransitionCount = 0;
    let redrawRaf = 0;
    let motionRaf = 0;
    let lastMotionRedrawAt = 0;

    const stopMotionRedraw = () => {
      if (motionRaf) {
        cancelAnimationFrame(motionRaf);
        motionRaf = 0;
      }

      lastMotionRedrawAt = 0;
    };

    const syncMotionFilter = () => {
      motionRaf = 0;

      if (sizeTransitionCount <= 0 || !redrawDuringSizeTransition) {
        return;
      }

      const now = performance.now();

      if (now - lastMotionRedrawAt >= MOTION_REDRAW_INTERVAL_MS) {
        lastMotionRedrawAt = now;
        lastWidth = -1;
        lastHeight = -1;
        lastRadius = -1;
        redraw({ motion: true });
      }

      motionRaf = requestAnimationFrame(syncMotionFilter);
    };

    const startMotionRedraw = () => {
      if (!redrawDuringSizeTransition || motionRaf) {
        return;
      }

      motionRaf = requestAnimationFrame(syncMotionFilter);
    };

    const apply = (value: string) => {
      if (value === lastBackdropValue) {
        return;
      }

      lastBackdropValue = value;
      el.style.backdropFilter = value;
      el.style.setProperty("-webkit-backdrop-filter", value);
    };

    const redraw = (options?: { motion?: boolean }) => {
      redrawRaf = 0;

      let { width, height } = getFilterDimensions(el);
      if (width === 0 || height === 0) {
        return;
      }

      if (options?.motion) {
        width = quantizeMotionSize(width);
        height = quantizeMotionSize(height);
      }

      const resolvedRadius =
        radius ?? (parseFloat(getComputedStyle(el).borderRadius) || 0);
      const safeRadius = Math.min(
        Number.isFinite(resolvedRadius) ? resolvedRadius : 0,
        Math.min(width, height) / 2,
      );

      if (
        width === lastWidth &&
        height === lastHeight &&
        safeRadius === lastRadius
      ) {
        return;
      }

      lastWidth = width;
      lastHeight = height;
      lastRadius = safeRadius;

      if (supportsUrlFilter) {
        const filter = getDisplacementFilter({
          width,
          height,
          radius: safeRadius,
          depth,
          strength,
          chromaticAberration,
        });
        apply(
          `blur(${blur / 2}px) url('${filter}') blur(${blur}px) brightness(${brightness}) saturate(${saturate})`,
        );
      } else {
        apply(`blur(${Math.max(width, height) / 20}px)`);
      }
    };

    const scheduleRedraw = () => {
      if (sizeTransitionCount > 0 && redrawDuringSizeTransition) {
        return;
      }

      if (sizeTransitionCount > 0 && !redrawDuringSizeTransition) {
        return;
      }

      if (redrawRaf) {
        return;
      }

      redrawRaf = requestAnimationFrame(() => {
        redraw();
      });
    };

    const applyBlurOnlyFallback = () => {
      const { width, height } = getFilterDimensions(el);

      if (width === 0 || height === 0) {
        return;
      }

      if (supportsUrlFilter) {
        apply(
          `blur(${Math.max(blur, 12)}px) brightness(${brightness}) saturate(${saturate})`,
        );
      } else {
        apply(`blur(${Math.max(width, height) / 20}px)`);
      }
    };

    const handleTransitionStart = (event: TransitionEvent) => {
      if (event.target !== el) {
        return;
      }

      if (
        SIZE_TRANSITION_PROPERTIES.has(event.propertyName) ||
        (redrawDuringSizeTransition && event.propertyName === "border-radius")
      ) {
        sizeTransitionCount += 1;

        if (sizeTransitionCount === 1 && !redrawDuringSizeTransition) {
          applyBlurOnlyFallback();
        }

        if (redrawDuringSizeTransition) {
          startMotionRedraw();
        }
      }
    };

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== el) {
        return;
      }

      if (
        !SIZE_TRANSITION_PROPERTIES.has(event.propertyName) &&
        !(redrawDuringSizeTransition && event.propertyName === "border-radius")
      ) {
        return;
      }

      sizeTransitionCount = Math.max(0, sizeTransitionCount - 1);

      if (sizeTransitionCount === 0) {
        stopMotionRedraw();
        lastWidth = -1;
        lastHeight = -1;
        lastRadius = -1;
        scheduleRedraw();
      }
    };

    redraw();

    const observer = new ResizeObserver(scheduleRedraw);
    observer.observe(el);

    el.addEventListener("transitionstart", handleTransitionStart);
    el.addEventListener("transitionend", handleTransitionEnd);
    el.addEventListener("transitioncancel", handleTransitionEnd);

    return () => {
      observer.disconnect();
      el.removeEventListener("transitionstart", handleTransitionStart);
      el.removeEventListener("transitionend", handleTransitionEnd);
      el.removeEventListener("transitioncancel", handleTransitionEnd);

      if (redrawRaf) {
        cancelAnimationFrame(redrawRaf);
      }

      stopMotionRedraw();

      lastWidth = -1;
      lastHeight = -1;
      lastRadius = -1;
      lastBackdropValue = "";
      sizeTransitionCount = 0;
      clearBackdropFilter(el);
    };
  }, [
    ref,
    blur,
    depth,
    strength,
    chromaticAberration,
    saturate,
    brightness,
    radius,
    enabled,
    mountKey,
    redrawDuringSizeTransition,
  ]);
}
