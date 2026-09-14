import { clamp } from "@/app/utils/numbers";
import { normalizeWheelDelta } from "@/app/utils/wheel";

export const PAGED_SNAP_DURATION_MS = 720;
export const PAGED_SNAP_LOCK_MS = 500;
export const PAGED_SNAP_POST_SETTLE_MS = 180;
export const PAGED_SNAP_WHEEL_THRESHOLD = 50;
export const PAGED_SNAP_TOUCH_THRESHOLD = 56;
export const PAGED_SNAP_MOBILE_TOUCH_THRESHOLD = 72;
export const PAGED_SNAP_SCROLL_END_FALLBACK_MS = 120;

export function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export function getNearestSnapIndex(scrollTop: number, offsets: number[]) {
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

export function getSectionSnapOffset(
  scrollContainer: HTMLElement,
  section: HTMLElement,
) {
  const containerRect = scrollContainer.getBoundingClientRect();
  const sectionRect = section.getBoundingClientRect();

  return sectionRect.top - containerRect.top + scrollContainer.scrollTop;
}

export function getSectionSnapOffsets(
  scrollContainer: HTMLElement,
  sections: HTMLElement[],
) {
  return sections.map((section) => getSectionSnapOffset(scrollContainer, section));
}

export function getPagedSnapDirection(
  deltaY: number,
  threshold = PAGED_SNAP_WHEEL_THRESHOLD,
): 1 | -1 | 0 {
  if (Math.abs(deltaY) < threshold) {
    return 0;
  }

  return deltaY > 0 ? 1 : -1;
}

export function getNormalizedWheelDeltaY(event: WheelEvent) {
  return normalizeWheelDelta(event, event.deltaY);
}

export function canNestedElementConsumeDelta(
  target: EventTarget | null,
  deltaY: number,
  nestedSelector?: string,
) {
  if (!nestedSelector || !(target instanceof Element) || deltaY === 0) {
    return false;
  }

  const nested = target.closest(nestedSelector);

  if (!(nested instanceof HTMLElement)) {
    return false;
  }

  if (nested.scrollHeight <= nested.clientHeight + 1) {
    return false;
  }

  const atTop = nested.scrollTop <= 0;
  const atBottom =
    nested.scrollTop + nested.clientHeight >= nested.scrollHeight - 1;

  if (deltaY < 0 && !atTop) {
    return true;
  }

  if (deltaY > 0 && !atBottom) {
    return true;
  }

  return false;
}

export function isDominantHorizontalWheel(
  event: WheelEvent,
  target: EventTarget | null,
  horizontalSelector?: string,
) {
  if (!horizontalSelector || !(target instanceof Element)) {
    return false;
  }

  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
    return false;
  }

  return Boolean(target.closest(horizontalSelector));
}

export function getNextPagedSectionIndex(
  currentIndex: number,
  direction: 1 | -1,
  maxIndex: number,
) {
  return clamp(currentIndex + direction, 0, maxIndex);
}

export function shouldUsePagedWheelSnap(isMobileViewport: boolean) {
  return !isMobileViewport;
}
