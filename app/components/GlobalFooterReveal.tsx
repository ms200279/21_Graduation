"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

import LandingFooter from "./LandingFooter";
import {
  isPeopleCarouselAtScrollEnd,
  isPeoplePagePath,
  PEOPLE_CAROUSEL_PROGRAMMATIC_STEP_EVENT,
  pinPeopleCarouselAtScrollEnd,
} from "./people-carousel/peopleCarouselFooter";

const FOOTER_VIEWPORT_RATIO = 0.4;
const FOOTER_REVEAL_MS = 420;
const POST_REVEAL_LOCK_MS = 180;
const WHEEL_DELTA_THRESHOLD = 30;
const PEOPLE_FOOTER_WHEEL_THRESHOLD = 28;
const PEOPLE_FOOTER_ARM_COOLDOWN_MS = 320;
/** Extra scroll lock after footer dismiss so trackpad lift doesn't scroll to #98. */
const PEOPLE_FOOTER_DISMISS_SCROLL_LOCK_MS = 420;
const TOUCH_SWIPE_THRESHOLD = 56;
const SCROLL_BOTTOM_THRESHOLD_PX = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeWheelDelta(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * window.innerHeight;
  }

  return event.deltaY;
}

function isDocumentScrollAtBottom(threshold = SCROLL_BOTTOM_THRESHOLD_PX) {
  const scrollTop = window.scrollY;
  const maxScrollTop = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );

  return scrollTop >= maxScrollTop - threshold;
}

export default function GlobalFooterReveal() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isPeoplePage = isPeoplePagePath(pathname);
  const [footerRevealProgress, setFooterRevealProgress] = useState(0);
  const footerRevealProgressRef = useRef(0);
  const footerAnimatingRef = useRef(false);
  const footerRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peopleScrollLockReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const scrollLockedUntilRef = useRef(0);
  const peopleCarouselScrollIdleRef = useRef(true);
  const peopleCarouselArmedAtEndRef = useRef(false);
  const peopleCarouselScrollEndTimeRef = useRef(0);
  const footerDismissScrollLockUntilRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const footerDockRef = useRef<HTMLDivElement>(null);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const applyFooterRevealProgress = useCallback((progress: number) => {
    const clamped = clamp(progress, 0, 1);

    footerRevealProgressRef.current = clamped;
    setFooterRevealProgress(clamped);
    document.documentElement.style.setProperty(
      "--landing-footer-reveal",
      String(clamped),
    );
  }, []);

  const syncPeopleCarouselScrollLock = useCallback(() => {
    if (!isPeoplePage) {
      document.documentElement.removeAttribute("data-people-carousel-scroll-lock");
      return;
    }

    const locked =
      footerRevealProgressRef.current > 0.001 ||
      footerAnimatingRef.current ||
      performance.now() < scrollLockedUntilRef.current ||
      performance.now() < footerDismissScrollLockUntilRef.current;

    if (locked) {
      document.documentElement.setAttribute(
        "data-people-carousel-scroll-lock",
        "",
      );
      pinPeopleCarouselAtScrollEnd();
      return;
    }

    document.documentElement.removeAttribute("data-people-carousel-scroll-lock");
  }, [isPeoplePage]);

  const releaseFooterGesture = useCallback(() => {
    footerAnimatingRef.current = false;
    scrollLockedUntilRef.current = performance.now() + POST_REVEAL_LOCK_MS;
    syncPeopleCarouselScrollLock();

    if (peopleScrollLockReleaseTimerRef.current) {
      clearTimeout(peopleScrollLockReleaseTimerRef.current);
    }

    peopleScrollLockReleaseTimerRef.current = setTimeout(() => {
      peopleScrollLockReleaseTimerRef.current = null;
      syncPeopleCarouselScrollLock();
    }, POST_REVEAL_LOCK_MS + 16);
  }, [syncPeopleCarouselScrollLock]);

  const setFooterRevealed = useCallback(
    (revealed: boolean) => {
      if (footerAnimatingRef.current) {
        return;
      }

      const targetProgress = revealed ? 1 : 0;

      if (
        Math.abs(footerRevealProgressRef.current - targetProgress) < 0.0001
      ) {
        return;
      }

      footerAnimatingRef.current = true;
      scrollLockedUntilRef.current =
        performance.now() + FOOTER_REVEAL_MS + POST_REVEAL_LOCK_MS;

      if (!revealed && isPeoplePage) {
        footerDismissScrollLockUntilRef.current =
          performance.now() +
          FOOTER_REVEAL_MS +
          POST_REVEAL_LOCK_MS +
          PEOPLE_FOOTER_DISMISS_SCROLL_LOCK_MS;
      }

      applyFooterRevealProgress(targetProgress);

      if (footerRevealTimerRef.current) {
        clearTimeout(footerRevealTimerRef.current);
      }

      footerRevealTimerRef.current = setTimeout(() => {
        footerRevealTimerRef.current = null;
        releaseFooterGesture();
      }, FOOTER_REVEAL_MS);

      syncPeopleCarouselScrollLock();
    },
    [applyFooterRevealProgress, isPeoplePage, releaseFooterGesture, syncPeopleCarouselScrollLock],
  );

  const canRevealFooter = useCallback(() => {
    if (isPeoplePage) {
      return isPeopleCarouselAtScrollEnd();
    }

    return isDocumentScrollAtBottom();
  }, [isPeoplePage]);

  useEffect(() => {
    if (isLandingPage) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      applyFooterRevealProgress(0);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [applyFooterRevealProgress, isLandingPage, pathname]);

  useEffect(() => {
    if (isLandingPage) {
      return;
    }

    document.documentElement.style.setProperty(
      "--landing-footer-ratio",
      String(FOOTER_VIEWPORT_RATIO),
    );
    document.documentElement.style.setProperty("--landing-footer-reveal", "0");

    const isScrollLocked = () => performance.now() < scrollLockedUntilRef.current;

    const isFooterEngaged = () =>
      footerRevealProgressRef.current > 0.001 || footerAnimatingRef.current;

    const shouldBlockPageScroll = () =>
      isFooterEngaged() ||
      isScrollLocked() ||
      (isPeoplePage &&
        performance.now() < footerDismissScrollLockUntilRef.current);

    const isPeopleFooterWheelReady = () => {
      if (
        !peopleCarouselScrollIdleRef.current ||
        !peopleCarouselArmedAtEndRef.current
      ) {
        return false;
      }

      return (
        performance.now() - peopleCarouselScrollEndTimeRef.current >=
        PEOPLE_FOOTER_ARM_COOLDOWN_MS
      );
    };

    const handleWheel = (event: WheelEvent) => {
      const deltaY = normalizeWheelDelta(event);

      if (shouldBlockPageScroll()) {
        event.preventDefault();
        syncPeopleCarouselScrollLock();

        if (isFooterEngaged() && deltaY < -WHEEL_DELTA_THRESHOLD) {
          setFooterRevealed(false);
        }

        return;
      }

      if (isPeoplePage) {
        const atCarouselEnd = canRevealFooter();

        if (
          deltaY > PEOPLE_FOOTER_WHEEL_THRESHOLD &&
          atCarouselEnd &&
          isPeopleFooterWheelReady()
        ) {
          event.preventDefault();
          setFooterRevealed(true);
          peopleCarouselArmedAtEndRef.current = false;
          return;
        }

        if (atCarouselEnd && deltaY > 0) {
          event.preventDefault();
        }

        return;
      }

      if (Math.abs(deltaY) < WHEEL_DELTA_THRESHOLD) {
        return;
      }

      if (deltaY > 0 && canRevealFooter()) {
        event.preventDefault();
        setFooterRevealed(true);
      }
    };

    const handleScroll = () => {
      if (isPeoplePage) {
        peopleCarouselScrollIdleRef.current = false;

        if (!isPeopleCarouselAtScrollEnd()) {
          peopleCarouselArmedAtEndRef.current = false;
        }

        syncPeopleCarouselScrollLock();
      }
    };

    const handleScrollEnd = () => {
      if (!isPeoplePage) {
        return;
      }

      if (performance.now() < footerDismissScrollLockUntilRef.current) {
        pinPeopleCarouselAtScrollEnd();
        return;
      }

      peopleCarouselScrollIdleRef.current = true;
      peopleCarouselScrollEndTimeRef.current = performance.now();
      peopleCarouselArmedAtEndRef.current = isPeopleCarouselAtScrollEnd();
    };

    const handleProgrammaticStep = (event: Event) => {
      if (!isPeoplePage) {
        return;
      }

      const direction = (event as CustomEvent<{ direction: -1 | 1 }>).detail
        ?.direction;

      if (direction !== -1) {
        return;
      }

      footerDismissScrollLockUntilRef.current = 0;
      scrollLockedUntilRef.current = 0;
      peopleCarouselArmedAtEndRef.current = false;
      syncPeopleCarouselScrollLock();
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (shouldBlockPageScroll()) {
        event.preventDefault();
        syncPeopleCarouselScrollLock();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (footerAnimatingRef.current || isScrollLocked()) {
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

      const footerOpen = isFooterEngaged();

      if (footerOpen) {
        if (deltaY > 0) {
          setFooterRevealed(false);
        }

        return;
      }

      if (
        deltaY < 0 &&
        canRevealFooter() &&
        isPeopleFooterWheelReady()
      ) {
        setFooterRevealed(true);
        peopleCarouselArmedAtEndRef.current = false;
      }
    };

    window.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scrollend", handleScrollEnd);
    window.addEventListener(
      PEOPLE_CAROUSEL_PROGRAMMATIC_STEP_EVENT,
      handleProgrammaticStep,
    );
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scrollend", handleScrollEnd);
      window.removeEventListener(
        PEOPLE_CAROUSEL_PROGRAMMATIC_STEP_EVENT,
        handleProgrammaticStep,
      );
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);

      if (footerRevealTimerRef.current) {
        clearTimeout(footerRevealTimerRef.current);
        footerRevealTimerRef.current = null;
      }

      if (peopleScrollLockReleaseTimerRef.current) {
        clearTimeout(peopleScrollLockReleaseTimerRef.current);
        peopleScrollLockReleaseTimerRef.current = null;
      }

      footerAnimatingRef.current = false;
      footerRevealProgressRef.current = 0;
      peopleCarouselScrollIdleRef.current = true;
      peopleCarouselArmedAtEndRef.current = false;
      peopleCarouselScrollEndTimeRef.current = 0;
      footerDismissScrollLockUntilRef.current = 0;
      setFooterRevealProgress(0);
      document.documentElement.removeAttribute("data-people-carousel-scroll-lock");
      document.documentElement.style.removeProperty("--landing-footer-reveal");
      document.documentElement.style.removeProperty("--landing-footer-ratio");
    };
  }, [canRevealFooter, isLandingPage, isPeoplePage, setFooterRevealed, syncPeopleCarouselScrollLock]);

  useEffect(() => {
    const dock = footerDockRef.current;

    if (!dock || isLandingPage) {
      return;
    }

    const handleFooterLinkClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest("a")) {
        return;
      }

      setFooterRevealed(false);
    };

    dock.addEventListener("click", handleFooterLinkClick);

    return () => {
      dock.removeEventListener("click", handleFooterLinkClick);
    };
  }, [footerRevealProgress, isLandingPage, setFooterRevealed]);

  if (isLandingPage || !isMounted) {
    return null;
  }

  return createPortal(
    <div
      ref={footerDockRef}
      className={[
        "landing-fullpage__footer-dock",
        footerRevealProgress > 0 ? "landing-fullpage__footer-dock--visible" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--landing-footer-reveal": String(footerRevealProgress),
        } as CSSProperties
      }
      aria-hidden={footerRevealProgress <= 0}
    >
      <LandingFooter />
    </div>,
    document.body,
  );
}
