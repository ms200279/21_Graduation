"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

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

function getLandingSnapOffsets(
  viewportHeight: number,
  options: { hasMedia: boolean },
) {
  const { hasMedia } = options;
  const offsets = [0, viewportHeight];

  if (hasMedia) {
    offsets.push(2 * viewportHeight);
  }

  return offsets;
}

function getNearestSnapSection(scrollTop: number, offsets: number[]) {
  let section = 0;
  let minDistance = Infinity;

  for (let index = 0; index < offsets.length; index += 1) {
    const distance = Math.abs(scrollTop - offsets[index]);

    if (distance < minDistance) {
      minDistance = distance;
      section = index;
    }
  }

  return section;
}

const SCROLL_LOCK_MS = 500;
const SECTION_SCROLL_DURATION_MS = 720;
const FOOTER_REVEAL_MS = 420;
const WHEEL_DELTA_THRESHOLD = 50;
const TOUCH_SWIPE_THRESHOLD = 56;
const SCROLL_END_FALLBACK_MS = 120;
/** Brief cooldown after scroll settles to absorb trackpad momentum tail. */
const POST_SETTLE_LOCK_MS = 180;

const landingScrollSectionProgressState = {
  current: 0,
  depthOnLeave: 0,
  maxProgressInGesture: 0,
};

const landingScrollRevealedState = { current: false };

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

const lastDispatchedScrollProgressState = {
  progress: Number.NaN,
  scrollProgress: Number.NaN,
  maxScrollProgressInGesture: Number.NaN,
};

function dispatchLandingScrollProgress(
  progress: number,
  scrollProgress: number,
  maxScrollProgressInGesture: number,
) {
  const shouldReveal = scrollProgress >= 1;

  if (
        Math.abs(progress - lastDispatchedScrollProgressState.progress) <
          0.0001 &&
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
  concept: ReactNode;
  media?: ReactNode;
  footer?: ReactNode;
  /** Decorative background layer rendered behind every section (fixed). */
  background?: ReactNode;
};

export default function LandingScrollExperience({
  hero,
  concept,
  media,
  footer,
  background,
}: LandingScrollExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastProgressRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const maxScrollProgressInGestureRef = useRef(0);
  const currentSectionRef = useRef(0);
  const scrollLockedUntilRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const wheelGestureConsumedRef = useRef(false);
  const touchGestureConsumedRef = useRef(false);
  const scrollEndFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const progressRafRef = useRef<number>(0);
  const footerRevealProgressRef = useRef(0);
  const footerAnimatingRef = useRef(false);
  const footerRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFooter = Boolean(media && footer);
  const [footerRevealProgress, setFooterRevealProgress] = useState(0);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const applyFooterRevealProgress = (progress: number) => {
    const clamped = clamp(progress, 0, 1);
    footerRevealProgressRef.current = clamped;
    setFooterRevealProgress(clamped);
    document.documentElement.style.setProperty(
      "--landing-footer-reveal",
      String(clamped),
    );
  };

  useEffect(() => {
    document.body.classList.add("landing-fullpage-active");
    document.documentElement.style.setProperty("--landing-footer-reveal", "0");
    document.documentElement.style.setProperty(
      "--landing-footer-ratio",
      String(LANDING_FOOTER_VIEWPORT_RATIO),
    );

    return () => {
      document.body.classList.remove("landing-fullpage-active");
      lastProgressRef.current = 0;
      maxScrollProgressInGestureRef.current = 0;
      dispatchLandingScrollProgress(0, 0, 0);
      if (footerRevealTimerRef.current) {
        clearTimeout(footerRevealTimerRef.current);
        footerRevealTimerRef.current = null;
      }
      footerAnimatingRef.current = false;
      footerRevealProgressRef.current = 0;
      setFooterRevealProgress(0);
      document.documentElement.style.removeProperty("--landing-footer-reveal");
      document.documentElement.style.removeProperty("--landing-footer-ratio");
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const hasFooterSnap = Boolean(media && footer);
    const snapOptions = { hasMedia: Boolean(media) };
    const mediaSectionIndex = snapOptions.hasMedia ? 2 : 1;

    const getSnapOffsets = (viewportHeight: number) =>
      getLandingSnapOffsets(viewportHeight, snapOptions);

    const maxSectionIndex = getSnapOffsets(1).length - 1;

    const isScrollLocked = () => performance.now() < scrollLockedUntilRef.current;

    const armScrollLock = (durationMs = SCROLL_LOCK_MS) => {
      scrollLockedUntilRef.current = performance.now() + durationMs;
    };

    const releaseFooterGesture = () => {
      footerAnimatingRef.current = false;
      wheelGestureConsumedRef.current = false;
      touchGestureConsumedRef.current = false;
      scrollLockedUntilRef.current = performance.now() + POST_SETTLE_LOCK_MS;
    };

    const setFooterRevealed = (revealed: boolean) => {
      if (footerAnimatingRef.current) {
        return false;
      }

      const targetProgress = revealed ? 1 : 0;

      if (Math.abs(footerRevealProgressRef.current - targetProgress) < 0.0001) {
        return false;
      }

      footerAnimatingRef.current = true;
      wheelGestureConsumedRef.current = true;
      touchGestureConsumedRef.current = true;
      armScrollLock(FOOTER_REVEAL_MS + POST_SETTLE_LOCK_MS);
      applyFooterRevealProgress(targetProgress);

      if (footerRevealTimerRef.current) {
        clearTimeout(footerRevealTimerRef.current);
      }

      footerRevealTimerRef.current = setTimeout(() => {
        footerRevealTimerRef.current = null;
        releaseFooterGesture();
      }, FOOTER_REVEAL_MS);

      return true;
    };

    const getSectionIndex = (scrollTop: number, viewportHeight: number) => {
      const offsets = getSnapOffsets(viewportHeight);

      return clamp(
        getNearestSnapSection(scrollTop, offsets),
        0,
        offsets.length - 1,
      );
    };

    const releaseScrollGesture = () => {
      isAnimatingRef.current = false;
      wheelGestureConsumedRef.current = false;
      touchGestureConsumedRef.current = false;
      scrollLockedUntilRef.current = performance.now() + POST_SETTLE_LOCK_MS;
    };

    let sectionScrollAnimationFrame = 0;
    let previousScrollSnapType: string | null = null;

    const restoreScrollSnap = () => {
      if (previousScrollSnapType === null) {
        return;
      }

      container.style.scrollSnapType = previousScrollSnapType;
      previousScrollSnapType = null;
    };

    const cancelSectionScrollAnimation = () => {
      if (sectionScrollAnimationFrame) {
        cancelAnimationFrame(sectionScrollAnimationFrame);
        sectionScrollAnimationFrame = 0;
      }

      restoreScrollSnap();
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
      releaseScrollGesture();
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

      if (targetSection !== mediaSectionIndex) {
        if (footerRevealTimerRef.current) {
          clearTimeout(footerRevealTimerRef.current);
          footerRevealTimerRef.current = null;
        }

        footerAnimatingRef.current = false;
        applyFooterRevealProgress(0);
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
      isAnimatingRef.current = true;
      wheelGestureConsumedRef.current = true;
      touchGestureConsumedRef.current = true;
      armScrollLock(SECTION_SCROLL_DURATION_MS + POST_SETTLE_LOCK_MS);

      const targetTop = getSnapOffsets(viewportHeight)[targetSection] ?? 0;
      cancelSectionScrollAnimation();

      if (behavior !== "smooth") {
        container.scrollTo({ top: targetTop, behavior: "auto" });
        return;
      }

      const startTop = container.scrollTop;
      const distance = targetTop - startTop;

      if (Math.abs(distance) < 1) {
        container.scrollTop = targetTop;
        handleScrollEnd();
        return;
      }

      const startedAt = performance.now();
      previousScrollSnapType = container.style.scrollSnapType;
      container.style.scrollSnapType = "none";

      const animateSectionScroll = (timestamp: number) => {
        const progress = clamp(
          (timestamp - startedAt) / SECTION_SCROLL_DURATION_MS,
          0,
          1,
        );
        const easedProgress =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        container.scrollTop = startTop + distance * easedProgress;

        if (progress < 1) {
          sectionScrollAnimationFrame = requestAnimationFrame(animateSectionScroll);
          return;
        }

        sectionScrollAnimationFrame = 0;
        restoreScrollSnap();
        container.scrollTop = targetTop;
        handleScrollEnd();
      };

      sectionScrollAnimationFrame = requestAnimationFrame(animateSectionScroll);
    };

    const scheduleProgressUpdate = () => {
      if (progressRafRef.current) {
        return;
      }

      progressRafRef.current = requestAnimationFrame(() => {
        progressRafRef.current = 0;
        updateProgress();
      });
    };

    const handleScroll = () => {
      scheduleProgressUpdate();
      scheduleScrollEndFallback();
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (isScrollLocked() || isAnimatingRef.current || footerAnimatingRef.current) {
        return;
      }

      if (wheelGestureConsumedRef.current) {
        return;
      }

      if (Math.abs(event.deltaY) < WHEEL_DELTA_THRESHOLD) {
        return;
      }

      const direction = event.deltaY > 0 ? 1 : -1;
      const currentSection = currentSectionRef.current;

      if (hasFooterSnap && currentSection === mediaSectionIndex) {
        if (direction > 0 && footerRevealProgressRef.current < 0.999) {
          setFooterRevealed(true);
          return;
        }

        if (direction < 0 && footerRevealProgressRef.current > 0.001) {
          setFooterRevealed(false);
          return;
        }
      }

      const targetSection = clamp(
        currentSection + direction,
        0,
        maxSectionIndex,
      );

      if (targetSection === currentSection) {
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
      if (
        isScrollLocked() ||
        isAnimatingRef.current ||
        footerAnimatingRef.current ||
        touchGestureConsumedRef.current
      ) {
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
      const currentSection = currentSectionRef.current;

      if (hasFooterSnap && currentSection === mediaSectionIndex) {
        if (direction > 0 && footerRevealProgressRef.current < 0.999) {
          setFooterRevealed(true);
          return;
        }

        if (direction < 0 && footerRevealProgressRef.current > 0.001) {
          setFooterRevealed(false);
          return;
        }
      }

      const targetSection = clamp(
        currentSection + direction,
        0,
        maxSectionIndex,
      );

      if (targetSection === currentSection) {
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

    let resizeRaf = 0;
    const handleResize = () => {
      if (resizeRaf) {
        return;
      }

      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        updateProgress();
      });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener(LANDING_FULLPAGE_SCROLL_TO_EVENT, handleScrollTo);

    return () => {
      if (footerRevealTimerRef.current) {
        clearTimeout(footerRevealTimerRef.current);
      }

      if (scrollEndFallbackTimerRef.current) {
        clearTimeout(scrollEndFallbackTimerRef.current);
      }

      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current);
      }

      cancelSectionScrollAnimation();

      if (resizeRaf) {
        cancelAnimationFrame(resizeRaf);
      }

      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("scrollend", handleScrollEnd);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(LANDING_FULLPAGE_SCROLL_TO_EVENT, handleScrollTo);
    };
  }, [media, footer]);

  return (
    <>
      <div ref={containerRef} className="landing-fullpage">
        {background}
        <section className="landing-fullpage__section landing-fullpage__section--hero">
          {hero}
        </section>
        <section className="landing-fullpage__section landing-fullpage__section--concept">
          {concept}
        </section>
        {media ? (
          <section className="landing-fullpage__section landing-fullpage__section--media">
            <div className="landing-fullpage__media-inner">{media}</div>
          </section>
        ) : null}
      </div>
      {hasFooter && isMounted
        ? createPortal(
            <div
              className={[
                "landing-fullpage__footer-dock",
                footerRevealProgress > 0 ? "landing-fullpage__footer-dock--visible" : "",
              ].join(" ")}
              style={
                {
                  "--landing-footer-reveal": String(footerRevealProgress),
                } as CSSProperties
              }
              aria-hidden={footerRevealProgress <= 0}
            >
              {footer}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
