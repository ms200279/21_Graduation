type WheelSnapListeners = {
  onWheel: (event: WheelEvent) => void;
  onScroll: () => void;
  onScrollEnd: () => void;
};

export function registerPeopleCarouselWheelSnapListeners({
  onWheel,
  onScroll,
  onScrollEnd,
}: WheelSnapListeners) {
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scrollend", onScrollEnd);
  window.addEventListener("resize", onScroll);

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("scrollend", onScrollEnd);
    window.removeEventListener("resize", onScroll);
  };
}
