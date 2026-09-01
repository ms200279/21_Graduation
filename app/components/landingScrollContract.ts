"use client";

export const LANDING_SCROLL_PROGRESS_EVENT = "landing-scroll-progress";
export const LANDING_SCROLL_INTENT_EVENT = "landing-scroll-intent";
export const LANDING_FULLPAGE_SCROLL_TO_EVENT = "landing-fullpage-scroll-to";

/** scrollProgress at or beyond the concept (carousel) section. */
export const landingScrollConceptThreshold = 1 - 0.0001;

/** scrollProgress at or beyond the media section. */
export const landingScrollMediaThreshold = 2 - 0.0001;

/** Footer panel height as a fraction of the viewport. */
export const LANDING_FOOTER_VIEWPORT_RATIO = 0.4;

/** scrollProgress when the footer snap is fully revealed. */
export const landingScrollFooterThreshold =
  2 + LANDING_FOOTER_VIEWPORT_RATIO - 0.0001;

/** Upper bound of the landing ↔ concept zone; above this is concept ↔ media travel. */
export const landingScrollHeaderExpandMaxProgress = 1 + 0.02;

export type LandingScrollDirection = "up" | "down";

export type LandingScrollProgressDetail = {
  progress: number;
  scrollProgress: number;
  maxScrollProgressInGesture: number;
};

const landingScrollSectionProgressState = {
  current: 0,
  depthOnLeave: 0,
  maxProgressInGesture: 0,
};

const landingScrollRevealedState = { current: false };

const lastDispatchedScrollProgressState = {
  progress: Number.NaN,
  scrollProgress: Number.NaN,
  maxScrollProgressInGesture: Number.NaN,
};

export function getLandingScrollGestureMaxProgress() {
  return landingScrollSectionProgressState.maxProgressInGesture;
}

export function getLandingScrollSectionProgress() {
  return landingScrollSectionProgressState.current;
}

export function setLandingScrollGestureMaxProgress(progress: number) {
  landingScrollSectionProgressState.maxProgressInGesture = progress;
}

export function resetLandingScrollGestureForOrbHome() {
  setLandingScrollGestureMaxProgress(0);
}

export function recordLandingScrollDepthOnLeave(depth: number) {
  landingScrollSectionProgressState.depthOnLeave = depth;
}

export function getLandingScrollDepthOnLeave() {
  return landingScrollSectionProgressState.depthOnLeave;
}

export function clearLandingScrollDepthOnLeave() {
  landingScrollSectionProgressState.depthOnLeave = 0;
}

export function dispatchLandingScrollIntent(
  direction: LandingScrollDirection,
) {
  window.dispatchEvent(
    new CustomEvent(LANDING_SCROLL_INTENT_EVENT, {
      detail: { direction },
    }),
  );
}

export function dispatchLandingScrollProgress({
  progress,
  scrollProgress,
  maxScrollProgressInGesture,
}: LandingScrollProgressDetail) {
  const shouldReveal = scrollProgress >= 1;

  if (
    Math.abs(progress - lastDispatchedScrollProgressState.progress) < 0.0001 &&
    Math.abs(
      scrollProgress - lastDispatchedScrollProgressState.scrollProgress,
    ) < 0.0001 &&
    maxScrollProgressInGesture ===
      lastDispatchedScrollProgressState.maxScrollProgressInGesture &&
    shouldReveal === landingScrollRevealedState.current
  ) {
    return;
  }

  lastDispatchedScrollProgressState.progress = progress;
  lastDispatchedScrollProgressState.scrollProgress = scrollProgress;
  lastDispatchedScrollProgressState.maxScrollProgressInGesture =
    maxScrollProgressInGesture;

  document.documentElement.style.setProperty(
    "--landing-scroll-progress",
    String(progress),
  );

  if (shouldReveal !== landingScrollRevealedState.current) {
    landingScrollRevealedState.current = shouldReveal;
    document.documentElement.classList.toggle(
      "landing-scroll-revealed",
      shouldReveal,
    );
  }

  landingScrollSectionProgressState.current = scrollProgress;
  setLandingScrollGestureMaxProgress(maxScrollProgressInGesture);

  window.dispatchEvent(
    new CustomEvent(LANDING_SCROLL_PROGRESS_EVENT, {
      detail: { progress, scrollProgress, maxScrollProgressInGesture },
    }),
  );
}

export function scrollLandingFullpageTo(
  top: number,
  behavior: ScrollBehavior = "smooth",
) {
  window.dispatchEvent(
    new CustomEvent(LANDING_FULLPAGE_SCROLL_TO_EVENT, {
      detail: { top, behavior },
    }),
  );
}
