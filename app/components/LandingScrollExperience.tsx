"use client";

import { useEffect, useRef, type ReactNode } from "react";

export const LANDING_SCROLL_PROGRESS_EVENT = "landing-scroll-progress";
export const LANDING_SCROLL_INTENT_EVENT = "landing-scroll-intent";
export const LANDING_FULLPAGE_SCROLL_TO_EVENT = "landing-fullpage-scroll-to";

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

function dispatchLandingScrollProgress(progress: number) {
  document.documentElement.style.setProperty(
    "--landing-scroll-progress",
    String(progress),
  );
  document.documentElement.classList.toggle(
    "landing-scroll-revealed",
    progress >= 1,
  );

  window.dispatchEvent(
    new CustomEvent(LANDING_SCROLL_PROGRESS_EVENT, {
      detail: { progress },
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
  children: ReactNode;
};

export default function LandingScrollExperience({
  hero,
  children,
}: LandingScrollExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastProgressRef = useRef(0);
  const lastScrollTopRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    document.body.classList.add("landing-fullpage-active");

    return () => {
      document.body.classList.remove("landing-fullpage-active");
      lastProgressRef.current = 0;
      dispatchLandingScrollProgress(0);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateProgress = () => {
      const viewportHeight = container.clientHeight;

      if (viewportHeight <= 0) {
        return;
      }

      const scrollTop = container.scrollTop;
      const progress = clamp(scrollTop / viewportHeight, 0, 1);

      if (scrollTop < lastScrollTopRef.current - 0.5) {
        dispatchLandingScrollIntent("up");
      }

      lastScrollTopRef.current = scrollTop;

      if (Math.abs(progress - lastProgressRef.current) < 0.0001) {
        return;
      }

      lastProgressRef.current = progress;
      dispatchLandingScrollProgress(progress);
    };

    const handleWheel = (event: WheelEvent) => {
      const viewportHeight = container.clientHeight;

      if (viewportHeight <= 0) {
        return;
      }

      if (
        event.deltaY < 0 &&
        container.scrollTop >= viewportHeight - 2
      ) {
        dispatchLandingScrollIntent("up");
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const viewportHeight = container.clientHeight;
      const touchStartY = touchStartYRef.current;
      const touchY = event.touches[0]?.clientY;

      if (
        viewportHeight <= 0 ||
        touchStartY === null ||
        touchY === undefined
      ) {
        return;
      }

      if (touchY - touchStartY > 8 && container.scrollTop >= viewportHeight - 2) {
        dispatchLandingScrollIntent("up");
      }
    };

    const handleScrollTo = (event: Event) => {
      const customEvent = event as CustomEvent<{
        top: number;
        behavior?: ScrollBehavior;
      }>;

      if (customEvent.detail.top <= 0) {
        dispatchLandingScrollIntent("up");
      }

      container.scrollTo({
        top: customEvent.detail.top,
        behavior: customEvent.detail.behavior ?? "smooth",
      });
    };

    updateProgress();
    container.addEventListener("scroll", updateProgress, { passive: true });
    container.addEventListener("wheel", handleWheel, { passive: true });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("resize", updateProgress);
    window.addEventListener(LANDING_FULLPAGE_SCROLL_TO_EVENT, handleScrollTo);

    return () => {
      container.removeEventListener("scroll", updateProgress);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", updateProgress);
      window.removeEventListener(LANDING_FULLPAGE_SCROLL_TO_EVENT, handleScrollTo);
    };
  }, []);

  return (
    <div ref={containerRef} className="landing-fullpage">
      <section className="landing-fullpage__section landing-fullpage__section--hero">
        {hero}
      </section>
      <section className="landing-fullpage__section landing-fullpage__section--content">
        {children}
      </section>
    </div>
  );
}
