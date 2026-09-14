"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { clamp } from "@/app/utils/numbers";
import { useIsMobileViewport } from "@/app/utils/useIsMobileViewport";
import {
  canNestedElementConsumeDelta,
  easeInOutCubic,
  getNearestSnapIndex,
  getNextPagedSectionIndex,
  getNormalizedWheelDeltaY,
  getPagedSnapDirection,
  getSectionSnapOffsets,
  isDominantHorizontalWheel,
  PAGED_SNAP_DURATION_MS,
  PAGED_SNAP_LOCK_MS,
  PAGED_SNAP_POST_SETTLE_MS,
  PAGED_SNAP_SCROLL_END_FALLBACK_MS,
  shouldUsePagedWheelSnap,
} from "./pagedSnapScroll";

type UsePagedSnapScrollOptions = {
  containerRef: RefObject<HTMLElement | null>;
  sectionSelector: string;
  nestedScrollSelector?: string;
  horizontalScrollSelector?: string;
  enabled?: boolean;
};

export function usePagedSnapScroll({
  containerRef,
  sectionSelector,
  nestedScrollSelector,
  horizontalScrollSelector,
  enabled = true,
}: UsePagedSnapScrollOptions) {
  const isMobile = useIsMobileViewport();
  const useWheelSnap = shouldUsePagedWheelSnap(isMobile);
  const [activeIndex, setActiveIndex] = useState(0);
  const currentSectionRef = useRef(0);
  const scrollLockedUntilRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const wheelGestureConsumedRef = useRef(false);
  const animationFrameRef = useRef(0);
  const previousScrollSnapTypeRef = useRef<string | null>(null);
  const scrollEndFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const getSections = useCallback(() => {
    const container = containerRef.current;

    if (!container) {
      return [] as HTMLElement[];
    }

    return Array.from(
      container.querySelectorAll<HTMLElement>(sectionSelector),
    );
  }, [containerRef, sectionSelector]);

  const getOffsets = useCallback(() => {
    const container = containerRef.current;
    const sections = getSections();

    if (!container || sections.length === 0) {
      return [] as number[];
    }

    return getSectionSnapOffsets(container, sections);
  }, [containerRef, getSections]);

  const setActiveSection = useCallback((index: number) => {
    currentSectionRef.current = index;
    setActiveIndex((currentIndex) =>
      currentIndex === index ? currentIndex : index,
    );
  }, []);

  const restoreScrollSnap = useCallback(() => {
    const container = containerRef.current;

    if (!container || previousScrollSnapTypeRef.current === null) {
      return;
    }

    container.style.scrollSnapType = previousScrollSnapTypeRef.current;
    previousScrollSnapTypeRef.current = null;
  }, [containerRef]);

  const cancelSectionScrollAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }

    restoreScrollSnap();
  }, [restoreScrollSnap]);

  const releaseScrollGesture = useCallback(() => {
    isAnimatingRef.current = false;
    wheelGestureConsumedRef.current = false;
    scrollLockedUntilRef.current = performance.now() + PAGED_SNAP_POST_SETTLE_MS;
  }, []);

  const syncActiveFromScroll = useCallback(() => {
    const container = containerRef.current;
    const offsets = getOffsets();

    if (!container || offsets.length === 0) {
      return;
    }

    const section = clamp(
      getNearestSnapIndex(container.scrollTop, offsets),
      0,
      offsets.length - 1,
    );
    setActiveSection(section);
  }, [containerRef, getOffsets, setActiveSection]);

  const scrollToIndex = useCallback(
    (targetSection: number, behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current;
      const offsets = getOffsets();

      if (!container || offsets.length === 0) {
        return;
      }

      const nextIndex = clamp(targetSection, 0, offsets.length - 1);
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const targetTop = offsets[nextIndex] ?? 0;
      const useJsSnap =
        useWheelSnap && behavior === "smooth" && !prefersReducedMotion;

      setActiveSection(nextIndex);
      cancelSectionScrollAnimation();

      if (!useJsSnap) {
        container.scrollTo({
          top: targetTop,
          behavior: prefersReducedMotion || behavior !== "smooth" ? "auto" : "smooth",
        });
        releaseScrollGesture();
        return;
      }

      const startTop = container.scrollTop;
      const distance = targetTop - startTop;

      if (Math.abs(distance) < 1) {
        container.scrollTop = targetTop;
        releaseScrollGesture();
        return;
      }

      isAnimatingRef.current = true;
      wheelGestureConsumedRef.current = true;
      scrollLockedUntilRef.current =
        performance.now() + PAGED_SNAP_DURATION_MS + PAGED_SNAP_POST_SETTLE_MS;
      previousScrollSnapTypeRef.current = container.style.scrollSnapType;
      container.style.scrollSnapType = "none";

      const startedAt = performance.now();

      const animateSectionScroll = (timestamp: number) => {
        const progress = clamp(
          (timestamp - startedAt) / PAGED_SNAP_DURATION_MS,
          0,
          1,
        );
        container.scrollTop = startTop + distance * easeInOutCubic(progress);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateSectionScroll);
          return;
        }

        animationFrameRef.current = 0;
        restoreScrollSnap();
        container.scrollTop = targetTop;
        releaseScrollGesture();
      };

      animationFrameRef.current = requestAnimationFrame(animateSectionScroll);
    },
    [
      cancelSectionScrollAnimation,
      containerRef,
      getOffsets,
      releaseScrollGesture,
      restoreScrollSnap,
      setActiveSection,
      useWheelSnap,
    ],
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!enabled || !container) {
      return;
    }

    const isScrollLocked = () => performance.now() < scrollLockedUntilRef.current;

    const handleScrollEnd = () => {
      syncActiveFromScroll();

      if (!isAnimatingRef.current) {
        releaseScrollGesture();
      }
    };

    const scheduleScrollEndFallback = () => {
      if (scrollEndFallbackTimerRef.current) {
        clearTimeout(scrollEndFallbackTimerRef.current);
      }

      scrollEndFallbackTimerRef.current = setTimeout(
        handleScrollEnd,
        PAGED_SNAP_SCROLL_END_FALLBACK_MS,
      );
    };

    const handleScroll = () => {
      if (!isAnimatingRef.current) {
        syncActiveFromScroll();
      }

      if (!isAnimatingRef.current) {
        scheduleScrollEndFallback();
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (
        isDominantHorizontalWheel(
          event,
          event.target,
          horizontalScrollSelector,
        )
      ) {
        return;
      }

      const deltaY = getNormalizedWheelDeltaY(event);

      if (
        canNestedElementConsumeDelta(event.target, deltaY, nestedScrollSelector)
      ) {
        return;
      }

      event.preventDefault();

      if (isScrollLocked() || isAnimatingRef.current) {
        return;
      }

      if (wheelGestureConsumedRef.current) {
        return;
      }

      const direction = getPagedSnapDirection(deltaY);

      if (direction === 0) {
        return;
      }

      const offsets = getOffsets();
      const targetSection = getNextPagedSectionIndex(
        currentSectionRef.current,
        direction,
        Math.max(0, offsets.length - 1),
      );

      if (targetSection === currentSectionRef.current) {
        return;
      }

      wheelGestureConsumedRef.current = true;
      scrollLockedUntilRef.current = performance.now() + PAGED_SNAP_LOCK_MS;
      scrollToIndex(targetSection);
    };

    syncActiveFromScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("scrollend", handleScrollEnd);

    if (useWheelSnap) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    const handleResize = () => {
      syncActiveFromScroll();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (scrollEndFallbackTimerRef.current) {
        clearTimeout(scrollEndFallbackTimerRef.current);
      }

      cancelSectionScrollAnimation();
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("scrollend", handleScrollEnd);
      container.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    cancelSectionScrollAnimation,
    containerRef,
    enabled,
    getOffsets,
    horizontalScrollSelector,
    nestedScrollSelector,
    releaseScrollGesture,
    scrollToIndex,
    syncActiveFromScroll,
    useWheelSnap,
  ]);

  return {
    activeIndex,
    scrollToIndex,
  };
}
