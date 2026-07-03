export function getPeopleCarouselScrollMetrics() {
  const track = document.querySelector<HTMLElement>(
    ".people-carousel-scroll-track",
  );

  if (!track) {
    return null;
  }

  const trackTop = track.offsetTop;
  const loopHeight = Math.max(0, track.offsetHeight - window.innerHeight);

  return {
    trackTop,
    loopHeight,
    maxCarouselScrollY: trackTop + loopHeight,
  };
}

export function isPeopleCarouselAtScrollEnd(threshold = 8) {
  const metrics = getPeopleCarouselScrollMetrics();

  if (!metrics) {
    return false;
  }

  return window.scrollY >= metrics.maxCarouselScrollY - threshold;
}

export function isInPeopleFooterHandoffZone(
  scrollY = window.scrollY,
  itemCount = 99,
) {
  const metrics = getPeopleCarouselScrollMetrics();

  if (!metrics || metrics.loopHeight <= 0 || itemCount <= 1) {
    return false;
  }

  const oneCardPx = metrics.loopHeight / (itemCount - 1);

  return scrollY >= metrics.maxCarouselScrollY - oneCardPx;
}

/** Revert inertial overshoot in the footer handoff lane (#98→#99). */
export function correctPeopleFooterHandoffScroll(
  releaseScrollY: number | null,
  endScrollY = window.scrollY,
  itemCount: number,
  driftCardFraction = 0.2,
) {
  const metrics = getPeopleCarouselScrollMetrics();

  if (!metrics || itemCount <= 1 || releaseScrollY === null) {
    return endScrollY;
  }

  const oneCardPx = metrics.loopHeight / (itemCount - 1);
  const handoffStartY = metrics.maxCarouselScrollY - oneCardPx;

  if (endScrollY < handoffStartY - oneCardPx * 0.5) {
    return endScrollY;
  }

  const driftPx = endScrollY - releaseScrollY;

  if (driftPx <= oneCardPx * driftCardFraction) {
    return Math.min(endScrollY, metrics.maxCarouselScrollY);
  }

  return Math.max(
    handoffStartY,
    Math.min(releaseScrollY, metrics.maxCarouselScrollY),
  );
}

export function isPeoplePagePath(pathname: string) {
  return pathname === "/peoplepage" || pathname.startsWith("/peoplepage/");
}

export function isPeopleCarouselScrollLockedByFooter() {
  return document.documentElement.hasAttribute(
    "data-people-carousel-scroll-lock",
  );
}

export const PEOPLE_CAROUSEL_PROGRAMMATIC_STEP_EVENT =
  "people-carousel-programmatic-step";

export function notifyPeopleCarouselProgrammaticStep(direction: -1 | 1) {
  window.dispatchEvent(
    new CustomEvent(PEOPLE_CAROUSEL_PROGRAMMATIC_STEP_EVENT, {
      detail: { direction },
    }),
  );
}

/** Keep window scroll pinned at #99 while the site footer owns the scroll gesture. */
export function pinPeopleCarouselAtScrollEnd(tolerancePx = 4) {
  const metrics = getPeopleCarouselScrollMetrics();

  if (!metrics) {
    return false;
  }

  const targetScrollY = metrics.maxCarouselScrollY;

  if (Math.abs(window.scrollY - targetScrollY) <= tolerancePx) {
    return false;
  }

  window.scrollTo(0, targetScrollY);
  return true;
}
