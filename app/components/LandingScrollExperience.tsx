"use client";

import { useEffect, useRef, type ReactNode } from "react";

export const LANDING_SCROLL_PROGRESS_EVENT = "landing-scroll-progress";
export const LANDING_SCROLL_INTENT_EVENT = "landing-scroll-intent";
export const LANDING_FULLPAGE_SCROLL_TO_EVENT = "landing-fullpage-scroll-to";

/** scrollProgress at or beyond the concept section (landing ↔ index animation is inactive). */
export const landingScrollConceptThreshold = 2 - 0.0001;

/** scrollProgress at or beyond the index section (outside landing ↔ index transition). */
export const landingScrollIndexThreshold = 1 - 0.0001;

/** Upper bound of the landing ↔ index zone; above this is index ↔ concept travel. */
export const landingScrollHeaderExpandMaxProgress = 1 + 0.02;

const SCROLL_LOCK_MS = 500;
const WHEEL_GESTURE_IDLE_MS = 160;
const WHEEL_DELTA_THRESHOLD = 50;
const TOUCH_SWIPE_THRESHOLD = 56;
const SCROLL_END_FALLBACK_MS = 120;

const landingScrollSectionProgressState = {
  current: 0,
  depthOnLeave: 0,
  maxProgressInGesture: 0,
};

export function getLandingScrollGestureMaxProgress() {
  return landingScrollSectionProgressState.maxProgressInGesture;
}

export function getLandingScrollSectionProgress() {
  return landingScrollSectionProgressState.current;
}

export function resetLandingScrollGestureForOrbHome() {
  landingScrollSectionProgressState.maxProgressInGesture = 0;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function dispatchLandingScrollIntent(direction: "up" | "down") {
  window.dispatchEvent(
    new CustomEvent(LANDING_SCROLL_INTENT_EVENT, {
      detail: { direction },
    }),
  );
}

function dispatchLandingScrollProgress(
  progress: number,
  scrollProgress: number,
  maxScrollProgressInGesture: number,
) {
  document.documentElement.style.setProperty(
    "--landing-scroll-progress",
    String(progress),
  );
  document.documentElement.classList.toggle(
    "landing-scroll-revealed",
    scrollProgress >= 1,
  );

  landingScrollSectionProgressState.current = scrollProgress;
  landingScrollSectionProgressState.maxProgressInGesture =
    maxScrollProgressInGesture;

  window.dispatchEvent(
    new CustomEvent(LANDING_SCROLL_PROGRESS_EVENT, {
      detail: { progress, scrollProgress, maxScrollProgressInGesture },
    }),
  );
}

export function scrollLandingFullpageTo(top: number, behavior: ScrollBehavior = "smooth") {
  window.dispatchEvent(
    new CustomEvent(LANDING_FULLPAGE_SCROLL_TO_EVENT, {
      detail: { top, behavior },
    }),
  );
}

type LandingScrollExperienceProps = {
  hero: ReactNode;
  index: ReactNode;
  concept?: ReactNode;
};

export default function LandingScrollExperience({
  hero,
  index,
  concept,
}: LandingScrollExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastProgressRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const maxScrollProgressInGestureRef = useRef(0);
  const currentSectionRef = useRef(0);
  const scrollLockedUntilRef = useRef(0);
  const wheelGestureConsumedRef = useRef(false);
  const wheelGestureIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const touchGestureConsumedRef = useRef(false);
  const scrollEndFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    document.body.classList.add("landing-fullpage-active");

    return () => {
      document.body.classList.remove("landing-fullpage-active");
      lastProgressRef.current = 0;
      maxScrollProgressInGestureRef.current = 0;
      dispatchLandingScrollProgress(0, 0, 0);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const maxSectionIndex = concept ? 2 : 1;

    const isScrollLocked = () => performance.now() < scrollLockedUntilRef.current;

    const armScrollLock = () => {
      scrollLockedUntilRef.current = performance.now() + SCROLL_LOCK_MS;
    };

    const getSectionIndex = (scrollTop: number, viewportHeight: number) =>
      clamp(Math.round(scrollTop / viewportHeight), 0, maxSectionIndex);

    const resetWheelGesture = () => {
      wheelGestureConsumedRef.current = false;
    };

    const scheduleWheelGestureReset = () => {
      if (wheelGestureIdleTimerRef.current) {
        clearTimeout(wheelGestureIdleTimerRef.current);
      }

      wheelGestureIdleTimerRef.current = setTimeout(
        resetWheelGesture,
        WHEEL_GESTURE_IDLE_MS,
      );
    };

    const updateProgress = () => {
      const viewportHeight = container.clientHeight;

      if (viewportHeight <= 0) {
        return;
      }

      const scrollTop = container.scrollTop;
      const scrollProgress = scrollTop / viewportHeight;
      const progress = clamp(scrollProgress, 0, 1);

      maxScrollProgressInGestureRef.current = Math.max(
        maxScrollProgressInGestureRef.current,
        scrollProgress,
      );

      lastScrollTopRef.current = scrollTop;

      if (Math.abs(scrollProgress - lastProgressRef.current) < 0.0001) {
        return;
      }

      lastProgressRef.current = scrollProgress;
      dispatchLandingScrollProgress(
        progress,
        scrollProgress,
        maxScrollProgressInGestureRef.current,
      );
    };

    const handleScrollEnd = () => {
      const viewportHeight = container.clientHeight;

      if (viewportHeight <= 0) {
        return;
      }

      const section = getSectionIndex(container.scrollTop, viewportHeight);
      currentSectionRef.current = section;
      maxScrollProgressInGestureRef.current = section;
      landingScrollSectionProgressState.maxProgressInGesture = section;
      armScrollLock();
      updateProgress();
    };

    const scheduleScrollEndFallback = () => {
      if (scrollEndFallbackTimerRef.current) {
        clearTimeout(scrollEndFallbackTimerRef.current);
      }

      scrollEndFallbackTimerRef.current = setTimeout(
        handleScrollEnd,
        SCROLL_END_FALLBACK_MS,
      );
    };

    const scrollToSection = (
      targetSection: number,
      behavior: ScrollBehavior = "smooth",
    ) => {
      const viewportHeight = container.clientHeight;

      if (viewportHeight <= 0) {
        return;
      }

      const currentSection = currentSectionRef.current;

      if (targetSection === currentSection) {
        return;
      }

      if (targetSection === 0 && currentSection > 0) {
        maxScrollProgressInGestureRef.current = 0;
        landingScrollSectionProgressState.maxProgressInGesture = 0;
      } else {
        maxScrollProgressInGestureRef.current = currentSection;
        landingScrollSectionProgressState.maxProgressInGesture = currentSection;
      }

      if (
        targetSection < currentSection &&
        currentSection === 1 &&
        targetSection === 0
      ) {
        dispatchLandingScrollIntent("up");
      }

      currentSectionRef.current = targetSection;
      armScrollLock();

      container.scrollTo({
        top: targetSection * viewportHeight,
        behavior,
      });
    };

    const handleScroll = () => {
      updateProgress();
      scheduleScrollEndFallback();
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (isScrollLocked()) {
        return;
      }

      scheduleWheelGestureReset();

      if (wheelGestureConsumedRef.current) {
        return;
      }

      if (Math.abs(event.deltaY) < WHEEL_DELTA_THRESHOLD) {
        return;
      }

      const direction = event.deltaY > 0 ? 1 : -1;
      const targetSection = clamp(
        currentSectionRef.current + direction,
        0,
        maxSectionIndex,
      );

      if (targetSection === currentSectionRef.current) {
        return;
      }

      wheelGestureConsumedRef.current = true;
      scrollToSection(targetSection);
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
      touchGestureConsumedRef.current = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isScrollLocked()) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (isScrollLocked() || touchGestureConsumedRef.current) {
        touchStartYRef.current = null;
        return;
      }

      const touchStartY = touchStartYRef.current;
      const touchY = event.changedTouches[0]?.clientY;

      touchStartYRef.current = null;

      if (touchStartY === null || touchY === undefined) {
        return;
      }

      const deltaY = touchY - touchStartY;

      if (Math.abs(deltaY) < TOUCH_SWIPE_THRESHOLD) {
        return;
      }

      const direction = deltaY < 0 ? 1 : -1;
      const targetSection = clamp(
        currentSectionRef.current + direction,
        0,
        maxSectionIndex,
      );

      if (targetSection === currentSectionRef.current) {
        return;
      }

      touchGestureConsumedRef.current = true;
      scrollToSection(targetSection);
    };

    const handleScrollTo = (event: Event) => {
      const customEvent = event as CustomEvent<{
        top: number;
        behavior?: ScrollBehavior;
      }>;

      const viewportHeight = container.clientHeight;

      if (viewportHeight <= 0) {
        return;
      }

      const targetSection =
        customEvent.detail.top <= 0
          ? 0
          : getSectionIndex(customEvent.detail.top, viewportHeight);

      if (targetSection === 0 && currentSectionRef.current === 1) {
        dispatchLandingScrollIntent("up");
      }

      scrollToSection(targetSection, customEvent.detail.behavior ?? "smooth");
    };

    currentSectionRef.current = getSectionIndex(container.scrollTop, container.clientHeight);
    maxScrollProgressInGestureRef.current = currentSectionRef.current;
    landingScrollSectionProgressState.maxProgressInGesture =
      currentSectionRef.current;

    updateProgress();
    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("scrollend", handleScrollEnd);
    window.addEventListener("resize", updateProgress);
    window.addEventListener(LANDING_FULLPAGE_SCROLL_TO_EVENT, handleScrollTo);

    return () => {
      if (wheelGestureIdleTimerRef.current) {
        clearTimeout(wheelGestureIdleTimerRef.current);
      }

      if (scrollEndFallbackTimerRef.current) {
        clearTimeout(scrollEndFallbackTimerRef.current);
      }

      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("scrollend", handleScrollEnd);
      window.removeEventListener("resize", updateProgress);
      window.removeEventListener(LANDING_FULLPAGE_SCROLL_TO_EVENT, handleScrollTo);
    };
  }, [concept]);

  return (
    <div ref={containerRef} className="landing-fullpage">
      <section className="landing-fullpage__section landing-fullpage__section--hero">
        {hero}
      </section>
      <section className="landing-fullpage__section landing-fullpage__section--index">
        {index}
      </section>
      {concept ? (
        <section className="landing-fullpage__section landing-fullpage__section--concept">
          {concept}
        </section>
      ) : null}
    </div>
  );
}
