import { afterEach, describe, expect, it, vi } from "vitest";

import { registerPeopleCarouselWheelSnapListeners } from "./peopleCarouselWheelSnapEvents";

describe("registerPeopleCarouselWheelSnapListeners", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces the scroll-end fallback on unsupported browsers", () => {
    vi.useFakeTimers();
    const onScroll = vi.fn();
    const onScrollEnd = vi.fn();
    const cleanup = registerPeopleCarouselWheelSnapListeners({
      onWheel: vi.fn(),
      onScroll,
      onScrollEnd,
      enableScrollEndFallback: true,
    });

    window.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(120);
    window.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(179);

    expect(onScroll).toHaveBeenCalledTimes(2);
    expect(onScrollEnd).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onScrollEnd).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("lets native scrollend cancel a pending fallback", () => {
    vi.useFakeTimers();
    const onScrollEnd = vi.fn();
    const cleanup = registerPeopleCarouselWheelSnapListeners({
      onWheel: vi.fn(),
      onScroll: vi.fn(),
      onScrollEnd,
      enableScrollEndFallback: true,
    });

    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scrollend"));
    vi.runAllTimers();

    expect(onScrollEnd).toHaveBeenCalledTimes(1);

    cleanup();
  });
});
