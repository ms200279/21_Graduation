type WheelSnapListeners = {
  onWheel: (event: WheelEvent) => void;
  onScroll: () => void;
  onScrollEnd: () => void;
  enableScrollEndFallback?: boolean;
};

const SCROLL_END_FALLBACK_MS = 140;

export function registerPeopleCarouselWheelSnapListeners({
  onWheel,
  onScroll,
  onScrollEnd,
  enableScrollEndFallback = false,
}: WheelSnapListeners) {
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  const clearFallback = () => {
    if (fallbackTimer !== null) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  };

  const handleScrollEnd = () => {
    clearFallback();
    onScrollEnd();
  };

  const scheduleScrollEndFallback = () => {
    clearFallback();
    fallbackTimer = setTimeout(() => {
      fallbackTimer = null;
      onScrollEnd();
    }, SCROLL_END_FALLBACK_MS);
  };

  const handleScroll = () => {
    onScroll();

    if (enableScrollEndFallback) {
      scheduleScrollEndFallback();
    }
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("scrollend", handleScrollEnd);
  if (enableScrollEndFallback) {
    window.addEventListener("touchend", scheduleScrollEndFallback, {
      passive: true,
    });
  }
  window.addEventListener("resize", handleScroll);

  return () => {
    clearFallback();
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("scrollend", handleScrollEnd);
    if (enableScrollEndFallback) {
      window.removeEventListener("touchend", scheduleScrollEndFallback);
    }
    window.removeEventListener("resize", handleScroll);
  };
}
