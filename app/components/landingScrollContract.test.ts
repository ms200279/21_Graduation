import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearLandingScrollDepthOnLeave,
  dispatchLandingScrollIntent,
  dispatchLandingScrollProgress,
  getLandingScrollDepthOnLeave,
  getLandingScrollGestureMaxProgress,
  getLandingScrollSectionProgress,
  LANDING_FULLPAGE_SCROLL_TO_EVENT,
  LANDING_SCROLL_INTENT_EVENT,
  LANDING_SCROLL_PROGRESS_EVENT,
  recordLandingScrollDepthOnLeave,
  resetLandingScrollGestureForOrbHome,
  scrollLandingFullpageTo,
} from "./landingScrollContract";

describe("landingScrollContract", () => {
  beforeEach(() => {
    clearLandingScrollDepthOnLeave();
    resetLandingScrollGestureForOrbHome();
    document.documentElement.classList.remove("landing-scroll-revealed");
    document.documentElement.style.removeProperty("--landing-scroll-progress");
  });

  it("keeps landing scroll state outside the rendering component", () => {
    recordLandingScrollDepthOnLeave(1.75);
    expect(getLandingScrollDepthOnLeave()).toBe(1.75);

    clearLandingScrollDepthOnLeave();
    expect(getLandingScrollDepthOnLeave()).toBe(0);

    dispatchLandingScrollProgress({
      progress: 1,
      scrollProgress: 2,
      maxScrollProgressInGesture: 2.25,
    });

    expect(getLandingScrollSectionProgress()).toBe(2);
    expect(getLandingScrollGestureMaxProgress()).toBe(2.25);
    expect(
      document.documentElement.style.getPropertyValue(
        "--landing-scroll-progress",
      ),
    ).toBe("1");
    expect(
      document.documentElement.classList.contains("landing-scroll-revealed"),
    ).toBe(true);
  });

  it("preserves the public custom-event contract", () => {
    const intentListener = vi.fn();
    const progressListener = vi.fn();
    const scrollToListener = vi.fn();

    window.addEventListener(LANDING_SCROLL_INTENT_EVENT, intentListener);
    window.addEventListener(LANDING_SCROLL_PROGRESS_EVENT, progressListener);
    window.addEventListener(LANDING_FULLPAGE_SCROLL_TO_EVENT, scrollToListener);

    dispatchLandingScrollIntent("up");
    dispatchLandingScrollProgress({
      progress: 0.25,
      scrollProgress: 0.25,
      maxScrollProgressInGesture: 0.5,
    });
    scrollLandingFullpageTo(0, "auto");

    expect(LANDING_SCROLL_INTENT_EVENT).toBe("landing-scroll-intent");
    expect(LANDING_SCROLL_PROGRESS_EVENT).toBe("landing-scroll-progress");
    expect(LANDING_FULLPAGE_SCROLL_TO_EVENT).toBe(
      "landing-fullpage-scroll-to",
    );
    expect(intentListener.mock.calls[0]?.[0]).toMatchObject({
      detail: { direction: "up" },
    });
    expect(progressListener.mock.calls[0]?.[0]).toMatchObject({
      detail: {
        progress: 0.25,
        scrollProgress: 0.25,
        maxScrollProgressInGesture: 0.5,
      },
    });
    expect(scrollToListener.mock.calls[0]?.[0]).toMatchObject({
      detail: { top: 0, behavior: "auto" },
    });

    window.removeEventListener(LANDING_SCROLL_INTENT_EVENT, intentListener);
    window.removeEventListener(
      LANDING_SCROLL_PROGRESS_EVENT,
      progressListener,
    );
    window.removeEventListener(
      LANDING_FULLPAGE_SCROLL_TO_EVENT,
      scrollToListener,
    );
  });
});
