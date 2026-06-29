"use client";

import { RefObject, useEffect } from "react";
import { LANDING_SCROLL_PROGRESS_EVENT } from "../LandingScrollExperience";

/**
 * Landing fullpage reaches scrollProgress 0..2 (hero → index → concept).
 * We normalize against this range so the "swim" distance maxes out at the
 * bottom of the experience.
 */
const MAX_PROGRESS = 2;

/** Treat the scroll as idle this many ms after the last progress update. */
const SCROLL_IDLE_MS = 140;

type ScrollSignal = {
  /** Raw scroll progress (0..MAX_PROGRESS on the landing page). */
  progress: number;
  /** Progress units per second (positive = scrolling down). */
  velocity: number;
  /** performance.now() of the last update. */
  lastUpdate: number;
};

const scrollSignal: ScrollSignal = {
  progress: 0,
  velocity: 0,
  lastUpdate: 0,
};

let prevProgress = 0;
let prevTime = 0;
let subscribers = 0;
let detach: (() => void) | null = null;

function updateSignal(rawProgress: number) {
  const now = performance.now();
  const dt = prevTime ? Math.max(16, now - prevTime) : 16;
  const dp = rawProgress - prevProgress;

  scrollSignal.velocity = (dp / dt) * 1000;
  scrollSignal.progress = rawProgress;
  scrollSignal.lastUpdate = now;

  prevProgress = rawProgress;
  prevTime = now;
}

function handleLandingProgress(event: Event) {
  const detail = (event as CustomEvent<{ scrollProgress: number }>).detail;
  if (!detail) return;
  updateSignal(detail.scrollProgress);
}

function handleWindowScroll() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const progress = max > 0 ? (doc.scrollTop / max) * MAX_PROGRESS : 0;
  updateSignal(progress);
}

function subscribeScroll() {
  subscribers += 1;
  if (detach) return;

  // Primary source: the landing fullpage experience.
  window.addEventListener(LANDING_SCROLL_PROGRESS_EVENT, handleLandingProgress);
  // Fallback for any non-landing usage.
  window.addEventListener("scroll", handleWindowScroll, { passive: true });

  detach = () => {
    window.removeEventListener(
      LANDING_SCROLL_PROGRESS_EVENT,
      handleLandingProgress,
    );
    window.removeEventListener("scroll", handleWindowScroll);
  };
}

function unsubscribeScroll() {
  subscribers -= 1;
  if (subscribers <= 0 && detach) {
    detach();
    detach = null;
    subscribers = 0;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export type JellyfishMotionOptions = {
  /** Parallax depth. Larger depth = larger scroll travel. */
  depth: number;
  /** Per-jellyfish multiplier on top of depth. */
  speedMultiplier?: number;
  /**
   * Scroll progress (0..MAX_PROGRESS) where this jellyfish sits centered in
   * the viewport. Motion is relative to this anchor so each jellyfish stays
   * visible in its home section instead of being pushed off-screen.
   */
  anchorProgress?: number;
  /** Clamp for the vertical swim distance (px). */
  maxTravelY?: number;
  /** Clamp for the horizontal drift distance (px). */
  maxTravelX?: number;
  /** Clamp for the scroll-driven rotation (deg). */
  maxRotate?: number;
};

/** Map initialY (%) on a 3-section stage to the scroll progress at viewport center. */
export function anchorProgressFromY(initialY: string, sections = 3): number {
  const y = parseFloat(initialY);
  if (Number.isNaN(y)) return 0;
  const progress = (y / 100) * sections - 0.5;
  return clamp(progress, 0, MAX_PROGRESS);
}

/**
 * Drives the scroll "swim" of a single jellyfish via requestAnimationFrame.
 *
 * Applies ONLY transform to the referenced element (the dedicated motion
 * layer). The base floating/contraction lives on separate child elements as
 * CSS animations, so JS transforms and CSS animations never collide on the
 * same node.
 */
export function useJellyfishMotion(
  ref: RefObject<HTMLElement | null>,
  options: JellyfishMotionOptions,
) {
  const {
    depth,
    speedMultiplier = 1,
    anchorProgress = 0,
    maxTravelY = 320,
    maxTravelX = 80,
    maxRotate = 8,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      el.style.transform = "none";
      return;
    }

    subscribeScroll();

    // Spring state per channel.
    let y = 0;
    let vy = 0;
    let x = 0;
    let vx = 0;
    let r = 0;
    let vr = 0;

    // Slightly under-critically damped for an organic settle.
    const stiffness = 90;
    const damping = 16;

    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
      last = now;

      const idle = now - scrollSignal.lastUpdate > SCROLL_IDLE_MS;
      const velocity = idle ? 0 : scrollSignal.velocity;

      const travel = depth * speedMultiplier;

      // Section-relative parallax: offset is zero when this jellyfish's home
      // section is centered in the viewport (anchorProgress). Scrolling away
      // from that section makes it swim, without ejecting other-section fish.
      const sectionDelta = scrollSignal.progress - anchorProgress;
      const targetY = clamp(
        -sectionDelta * travel * 140 - velocity * travel * 60,
        -maxTravelY,
        maxTravelY,
      );
      const targetX = clamp(
        sectionDelta * travel * 18 + velocity * travel * 45,
        -maxTravelX,
        maxTravelX,
      );
      const targetR = clamp(velocity * travel * 9, -maxRotate, maxRotate);

      const ay = stiffness * (targetY - y) - damping * vy;
      vy += ay * dt;
      y += vy * dt;

      const ax = stiffness * (targetX - x) - damping * vx;
      vx += ax * dt;
      x += vx * dt;

      const ar = stiffness * (targetR - r) - damping * vr;
      vr += ar * dt;
      r += vr * dt;

      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(
        2,
      )}px, 0) rotate(${r.toFixed(2)}deg)`;

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      unsubscribeScroll();
    };
  }, [
    depth,
    speedMultiplier,
    anchorProgress,
    maxTravelY,
    maxTravelX,
    maxRotate,
    ref,
  ]);
}
