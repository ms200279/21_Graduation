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
  /** Fallback delay before restoring displacement after a size morph (blur-only path). */
  sizeTransitionRestoreMs?: number;
  /** Strength multiplier applied while a size morph is running. */
  motionStrengthScale?: number;
  /** Chromatic aberration while morphing; lower values reduce edge shimmer. */
  motionChromaticAberration?: number;
  /** Min layout delta before regenerating displacement during a morph. */
  motionSizeChangeThreshold?: number;
  /** Keep one displacement map sized to the morph target for the whole transition. */
  motionLockFilterDimensions?: boolean;
}

/** Shared preset for landing INFO box and header glass surfaces. */
export const LANDING_INFO_LIQUID_GLASS_OPTIONS: Pick<
  UseLiquidGlassOptions,
  "depth" | "strength" | "chromaticAberration" | "blur" | "redrawDuringSizeTransition"
> = {
  depth: 10,
  strength: 150,
  chromaticAberration: 6,
  blur: 1,
  redrawDuringSizeTransition: false,
};

/** Header nav morph: same glass params at every size (no blur-only fallback). */
export const LANDING_HEADER_NAV_LIQUID_GLASS_OPTIONS: Pick<
  UseLiquidGlassOptions,
  | "depth"
  | "strength"
  | "chromaticAberration"
  | "blur"
  | "redrawDuringSizeTransition"
  | "motionStrengthScale"
  | "motionChromaticAberration"
  | "motionSizeChangeThreshold"
> = {
  ...LANDING_INFO_LIQUID_GLASS_OPTIONS,
  redrawDuringSizeTransition: true,
  motionStrengthScale: 1,
  motionChromaticAberration: LANDING_INFO_LIQUID_GLASS_OPTIONS.chromaticAberration,
  motionSizeChangeThreshold: 4,
};

const SIZE_TRANSITION_PROPERTIES = new Set([
  "width",
  "height",
  "padding",
  "padding-left",
  "padding-right",
  "padding-top",
  "padding-bottom",
]);

/** Default matches the landing header nav width/padding morph duration. */
const DEFAULT_SIZE_TRANSITION_RESTORE_MS = 720;
const MOTION_REDRAW_INTERVAL_MS = 16;
const DEFAULT_MOTION_STRENGTH_SCALE = 0.68;
const DEFAULT_MOTION_CHROMATIC_ABERRATION = 2;
const DEFAULT_MOTION_SIZE_CHANGE_THRESHOLD = 6;

function getFilterDimensions(el: HTMLElement) {
  // Layout size (pre-transform). getBoundingClientRect() returns post-transform
  // visual size and breaks displacement maps when an ancestor uses scale().
  return {
    width: Math.round(el.offsetWidth),
    height: Math.round(el.offsetHeight),
  };
}

function getHeaderMorphTargets(el: HTMLElement) {
  const header = el.closest(".desktop-header") as HTMLElement | null;
  const style = getComputedStyle(header ?? el);
  const collapsedWidth = Math.round(
    parseFloat(style.getPropertyValue("--orb-size")) || el.offsetWidth,
  );
  const expandedWidth = header
    ? Math.round(header.offsetWidth)
    : Math.round(parseFloat(style.getPropertyValue("--header-width")) || collapsedWidth);
  const height = Math.round(
    parseFloat(style.getPropertyValue("--header-height")) || el.offsetHeight,
  );

  return { collapsedWidth, expandedWidth, height };
}

function resolveMorphTargetDimensions(el: HTMLElement) {
  const { expandedWidth, height } = getHeaderMorphTargets(el);

  return {
    width: expandedWidth,
    height,
  };
}

function hasMotionSizeChange(
  width: number,
  height: number,
  radius: number,
  lastWidth: number,
  lastHeight: number,
  lastRadius: number,
  threshold: number,
) {
  if (lastWidth < 0 || lastHeight < 0) {
    return true;
  }

  return (
    Math.abs(width - lastWidth) >= threshold ||
    Math.abs(height - lastHeight) >= threshold ||
    Math.abs(radius - lastRadius) >= 1
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
    sizeTransitionRestoreMs = DEFAULT_SIZE_TRANSITION_RESTORE_MS,
    motionStrengthScale = DEFAULT_MOTION_STRENGTH_SCALE,
    motionChromaticAberration = DEFAULT_MOTION_CHROMATIC_ABERRATION,
    motionSizeChangeThreshold = DEFAULT_MOTION_SIZE_CHANGE_THRESHOLD,
    motionLockFilterDimensions = false,
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
    let morphRestoreTimer: ReturnType<typeof setTimeout> | null = null;
    let lastMotionRedrawAt = 0;
    let lastDrawWasMotion = false;
    let motionLockedFilterDimensions: {
      width: number;
      height: number;
      radius: number;
    } | null = null;

    const clearMotionLockedFilterDimensions = () => {
      motionLockedFilterDimensions = null;
    };

    const lockMotionFilterDimensions = () => {
      if (!motionLockFilterDimensions) {
        return;
      }

      const target = resolveMorphTargetDimensions(el);
      motionLockedFilterDimensions = {
        width: target.width,
        height: target.height,
        radius: resolveRadius(target.width, target.height),
      };
    };

    const resolveDrawDimensions = (options?: { motion?: boolean }) => {
      if (options?.motion && motionLockedFilterDimensions) {
        return motionLockedFilterDimensions;
      }

      const { width, height } = getFilterDimensions(el);

      return {
        width,
        height,
        radius: resolveRadius(width, height),
      };
    };

    const clearMorphRestoreTimer = () => {
      if (morphRestoreTimer) {
        clearTimeout(morphRestoreTimer);
        morphRestoreTimer = null;
      }
    };

    const restoreFullGlass = () => {
      clearMorphRestoreTimer();
      stopMotionRedraw();
      clearMotionLockedFilterDimensions();
      sizeTransitionCount = 0;
      lastWidth = -1;
      lastHeight = -1;
      lastRadius = -1;
      lastBackdropValue = "";
      lastDrawWasMotion = false;
      redraw();
    };

    const resolveRadius = (width: number, height: number) => {
      const resolvedRadius =
        radius ?? (parseFloat(getComputedStyle(el).borderRadius) || 0);

      return Math.min(
        Number.isFinite(resolvedRadius) ? resolvedRadius : 0,
        Math.min(width, height) / 2,
      );
    };

    const stopMotionRedraw = () => {
      if (motionRaf) {
        cancelAnimationFrame(motionRaf);
        motionRaf = 0;
      }

      lastMotionRedrawAt = 0;
    };

    const scheduleMorphRestoreFallback = () => {
      if (redrawDuringSizeTransition) {
        return;
      }

      clearMorphRestoreTimer();
      morphRestoreTimer = setTimeout(() => {
        morphRestoreTimer = null;
        restoreFullGlass();
      }, sizeTransitionRestoreMs);
    };

    const syncMotionFilter = () => {
      motionRaf = 0;

      if (
        sizeTransitionCount <= 0 ||
        !redrawDuringSizeTransition ||
        motionLockFilterDimensions
      ) {
        return;
      }

      const now = performance.now();

      if (now - lastMotionRedrawAt < MOTION_REDRAW_INTERVAL_MS) {
        motionRaf = requestAnimationFrame(syncMotionFilter);
        return;
      }

      const { width, height } = getFilterDimensions(el);

      if (width === 0 || height === 0) {
        motionRaf = requestAnimationFrame(syncMotionFilter);
        return;
      }

      const safeRadius = resolveRadius(width, height);

      if (
        !hasMotionSizeChange(
          width,
          height,
          safeRadius,
          lastWidth,
          lastHeight,
          lastRadius,
          motionSizeChangeThreshold,
        )
      ) {
        motionRaf = requestAnimationFrame(syncMotionFilter);
        return;
      }

      lastMotionRedrawAt = now;
      redraw({ motion: true });
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

      const { width, height, radius: safeRadius } = resolveDrawDimensions(options);

      if (width === 0 || height === 0) {
        return;
      }

      const isMotion = Boolean(options?.motion);

      if (
        width === lastWidth &&
        height === lastHeight &&
        safeRadius === lastRadius &&
        isMotion === lastDrawWasMotion
      ) {
        return;
      }

      lastWidth = width;
      lastHeight = height;
      lastRadius = safeRadius;
      lastDrawWasMotion = isMotion;

      const activeStrength = isMotion
        ? Math.max(1, Math.round(strength * motionStrengthScale))
        : strength;
      const activeChromaticAberration = isMotion
        ? motionChromaticAberration
        : chromaticAberration;

      if (supportsUrlFilter) {
        const filter = getDisplacementFilter({
          width,
          height,
          radius: safeRadius,
          depth,
          strength: activeStrength,
          chromaticAberration: activeChromaticAberration,
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
          scheduleMorphRestoreFallback();
        }

        if (redrawDuringSizeTransition) {
          lastMotionRedrawAt = 0;
          lastWidth = -1;
          lastHeight = -1;
          lastRadius = -1;
          lastBackdropValue = "";

          if (motionLockFilterDimensions) {
            lockMotionFilterDimensions();
            redraw({ motion: true });
          } else {
            redraw({ motion: true });
            startMotionRedraw();
          }
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
        restoreFullGlass();
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

      clearMorphRestoreTimer();
      stopMotionRedraw();
      clearMotionLockedFilterDimensions();

      lastWidth = -1;
      lastHeight = -1;
      lastRadius = -1;
      lastBackdropValue = "";
      sizeTransitionCount = 0;
      lastDrawWasMotion = false;
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
    sizeTransitionRestoreMs,
    motionStrengthScale,
    motionChromaticAberration,
    motionSizeChangeThreshold,
    motionLockFilterDimensions,
  ]);
}
