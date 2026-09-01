import type { PeopleCarouselItem } from "./items";
import { clamp } from "@/app/utils/numbers";

const CARD_GAP_PX = 0;
const DISCRETE_WHEEL_DELTA_THRESHOLD_PX = 40;
const ZONE_SNAP_THRESHOLD = 0.45;
const PAGE_END_SNAP_ZONE_FRACTION = 0.25;
const SNAP_EASE_OVERSHOOT = 0.82;
export const MIN_CAROUSEL_RADIUS_PX = 180;
const RADIUS_SCALE = 0.7;
const GLASS_EFFECT_SLOT_COUNT = 4;

/** Scroll distance assigned to each card along the track. */
export const SCROLL_VH_PER_CARD = 12;
export const SNAP_DURATION_MS = 420;
export const SNAP_POSITION_TOLERANCE_PX = 4;
export const WHEEL_GESTURE_RELEASE_MS = 120;
export const CAROUSEL_SCALE = 0.96;
export const VIEW_ROTATE_Y_DEG = 10;
export const VIEW_ROTATE_X_DEG = 0;
export const RIG_CENTER_OFFSET_X = "-4%";
export const RIG_CENTER_OFFSET_Y = "-2%";
export const INITIAL_ROTATION_OFFSET_DEG = 22;
export const ZONE_HOVER_STAND_DEG = 14;
export const ZONE_HOVER_LIFT_PX = 22;
export const EXPANDED_CARD_WIDTH_PX = 1080;
export const EXPANDED_CARD_HEIGHT_PX = 600;
export const EXPAND_DURATION_MS = 520;
export const CAROUSEL_ENTRY_DURATION_MS = 1650;
export const EXPAND_MORPH_TRANSFORM_END_COUNT = 4;
/** Cards shown on the cylinder per batch (e.g. 1-11, then 12-22). */
export const VISIBLE_CAROUSEL_SLOTS = 11;

export type CardRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type ExpandRestPose = {
  displayRotation: number;
  zoneCardAngle: number;
  carouselRadius: number;
  carouselPerspective: number;
  stageWidth: number;
  stageHeight: number;
};

export type ExpandAnchorMetrics = {
  bodyAnchorRect: CardRect;
  cardOrigin: { x: number; y: number };
};

export type ExpandedCardState = {
  item: PeopleCarouselItem;
  itemIndex: number;
  restPose: ExpandRestPose;
  anchor: ExpandAnchorMetrics;
  openWithHover: boolean;
  isOpen: boolean;
  isClosing: boolean;
  pendingClose: boolean;
};

export type CarouselEntryPhase = "before" | "entering" | "complete";

export function captureExpandRestPose(
  stageElement: HTMLElement | null,
  displayRotation: number,
  zoneSlotInBatch: number,
  slotAngleStep: number,
  carouselRadius: number,
  carouselPerspective: number,
): ExpandRestPose {
  return {
    displayRotation,
    zoneCardAngle: -zoneSlotInBatch * slotAngleStep,
    carouselRadius,
    carouselPerspective,
    stageWidth: stageElement?.offsetWidth ?? 0,
    stageHeight: stageElement?.offsetHeight ?? 0,
  };
}

export function getCarouselRigTransform() {
  return `translate(${RIG_CENTER_OFFSET_X}, ${RIG_CENTER_OFFSET_Y}) rotateY(${VIEW_ROTATE_Y_DEG}deg) rotateX(${VIEW_ROTATE_X_DEG}deg) scale(${CAROUSEL_SCALE})`;
}

export function getCarouselSlotTransform(
  zoneCardAngle: number,
  carouselRadius: number,
) {
  return `rotateX(${zoneCardAngle}deg) translateZ(${carouselRadius}px)`;
}

export function domRectToCardRect(rect: DOMRect): CardRect {
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function measureExpandAnchorMetrics(
  bodyElement: HTMLElement | null,
  surfaceElement: HTMLElement | null,
): ExpandAnchorMetrics | null {
  if (!bodyElement || !surfaceElement) {
    return null;
  }

  const bodyRect = bodyElement.getBoundingClientRect();
  const surfaceRect = surfaceElement.getBoundingClientRect();

  return {
    bodyAnchorRect: domRectToCardRect(bodyRect),
    cardOrigin: {
      x: surfaceRect.left + surfaceRect.width / 2 - bodyRect.left,
      y: surfaceRect.top + surfaceRect.height / 2 - bodyRect.top,
    },
  };
}

export function expandAnchorMetricsEqual(
  left: ExpandAnchorMetrics,
  right: ExpandAnchorMetrics,
) {
  return (
    left.bodyAnchorRect.top === right.bodyAnchorRect.top &&
    left.bodyAnchorRect.left === right.bodyAnchorRect.left &&
    left.bodyAnchorRect.width === right.bodyAnchorRect.width &&
    left.bodyAnchorRect.height === right.bodyAnchorRect.height &&
    left.cardOrigin.x === right.cardOrigin.x &&
    left.cardOrigin.y === right.cardOrigin.y
  );
}

export function computeExpandAlignBaseRect(
  containerRect: CardRect,
  stageWidth: number,
  stageHeight: number,
  paddingTop: number,
  paddingBottom: number,
): CardRect {
  const innerHeight = containerRect.height - paddingTop - paddingBottom;

  return {
    left: containerRect.left + (containerRect.width - stageWidth) / 2,
    top: containerRect.top + paddingTop + innerHeight - stageHeight,
    width: stageWidth,
    height: stageHeight,
  };
}

export function getExpandAlignTransform(
  alignBaseRect: CardRect,
  stageWidth: number,
  stageHeight: number,
  expanded: CardRect,
) {
  if (stageWidth <= 0 || stageHeight <= 0) {
    return "none";
  }

  const scaleX = expanded.width / stageWidth;
  const scaleY = expanded.height / stageHeight;
  const expandedCenterX = expanded.left + expanded.width / 2;
  const expandedCenterY = expanded.top + expanded.height / 2;
  const alignCenterX = alignBaseRect.left + alignBaseRect.width / 2;
  const alignCenterY = alignBaseRect.top + alignBaseRect.height / 2;

  return `translate(${expandedCenterX - alignCenterX}px, ${expandedCenterY - alignCenterY}px) scale(${scaleX}, ${scaleY})`;
}

export function getExpandedTargetRect(
  viewportWidth: number,
  viewportHeight: number,
): CardRect {
  const aspect = EXPANDED_CARD_WIDTH_PX / EXPANDED_CARD_HEIGHT_PX;
  const horizontalPadding = 48;
  const verticalPadding = 48;
  const maxWidth = Math.min(
    EXPANDED_CARD_WIDTH_PX,
    viewportWidth - horizontalPadding,
  );
  const maxHeight = Math.min(
    EXPANDED_CARD_HEIGHT_PX,
    viewportHeight - verticalPadding,
  );

  let width = maxWidth;
  let height = width / aspect;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }

  return {
    top: (viewportHeight - height) / 2,
    left: (viewportWidth - width) / 2,
    width,
    height,
  };
}

export function getExpandedTargetRectFallback(): CardRect {
  if (typeof window !== "undefined") {
    return getExpandedTargetRect(window.innerWidth, window.innerHeight);
  }

  return {
    top: 0,
    left: 0,
    width: EXPANDED_CARD_WIDTH_PX,
    height: EXPANDED_CARD_HEIGHT_PX,
  };
}

export function getCarouselRadius(
  cardHeightPx: number,
  cardWidthPx: number,
  itemCount: number,
) {
  if (itemCount <= 1 || cardHeightPx <= 0) {
    return MIN_CAROUSEL_RADIUS_PX;
  }

  const angleStepRad = (2 * Math.PI) / itemCount;
  const halfStep = angleStepRad / 2;
  const projectedCardSpan =
    cardHeightPx * Math.cos(halfStep) + cardWidthPx * Math.sin(halfStep);

  return Math.ceil(
    ((projectedCardSpan + CARD_GAP_PX) / angleStepRad) * RADIUS_SCALE,
  );
}

export function getCarouselPerspective(radiusPx: number) {
  return Math.max(Math.ceil(radiusPx * 2.8), 960);
}

export function mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

export function normalizeWheelDelta(event: WheelEvent, delta: number) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return delta * 16;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return delta * window.innerHeight;
  }

  return delta;
}

export function isLikelyDiscreteMouseWheel(
  event: WheelEvent,
  deltaX: number,
  deltaY: number,
) {
  if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) {
    return true;
  }

  return (
    Math.abs(deltaX) < 1 &&
    Math.abs(deltaY) >= DISCRETE_WHEEL_DELTA_THRESHOLD_PX &&
    Number.isInteger(event.deltaY)
  );
}

export function easeOutBack(
  progress: number,
  overshoot = SNAP_EASE_OVERSHOOT,
) {
  const cubicCoefficient = overshoot + 1;

  return (
    1 +
    cubicCoefficient * Math.pow(progress - 1, 3) +
    overshoot * Math.pow(progress - 1, 2)
  );
}

export function getBatchCount(itemCount: number, batchSize: number) {
  if (itemCount <= 0 || batchSize <= 0) {
    return 0;
  }

  return Math.ceil(itemCount / batchSize);
}

export function isSlotInGlassEffectWindow(
  slotIndex: number,
  activeSlotIndex: number,
  slotCount: number,
) {
  if (slotCount <= 0) {
    return false;
  }

  const forwardDistance = mod(slotIndex - activeSlotIndex, slotCount);
  const backwardDistance = mod(activeSlotIndex - slotIndex, slotCount);

  return backwardDistance <= 1 || forwardDistance < GLASS_EFFECT_SLOT_COUNT - 1;
}

export function getCarouselStateFromItemPosition(
  itemPosition: number,
  itemCount: number,
  batchSize: number,
  snap: boolean,
) {
  if (itemCount <= 0) {
    return { itemIndex: 0, batchIndex: 0, rotation: 0 };
  }

  const maxIndex = itemCount - 1;
  const clampedPosition = clamp(itemPosition, 0, maxIndex);

  if (snap) {
    const itemIndex = Math.round(clampedPosition);
    const batchIndex = Math.floor(itemIndex / batchSize);
    const slotInBatch = itemIndex % batchSize;
    const rotation = slotInBatch * (360 / batchSize);

    return { itemIndex, batchIndex, rotation };
  }

  const itemIndex = Math.round(clampedPosition);
  const batchIndex = Math.floor(itemIndex / batchSize);
  const slotFloat = clampedPosition - batchIndex * batchSize;
  const rotation = slotFloat * (360 / batchSize);

  return { itemIndex, batchIndex, rotation };
}

export function getScrollMetrics(track: HTMLElement) {
  const trackTop = track.offsetTop;
  const loopHeight = track.offsetHeight - window.innerHeight;

  return { trackTop, loopHeight };
}

export function getItemIndexFromScrollProgress(
  progress: number,
  maxItemIndex: number,
) {
  if (maxItemIndex <= 0) {
    return 0;
  }

  return Math.round(clamp(progress, 0, 1) * maxItemIndex);
}

export function getScrollProgressForItemIndex(
  itemIndex: number,
  maxItemIndex: number,
) {
  if (maxItemIndex <= 0) {
    return 0;
  }

  return clamp(itemIndex, 0, maxItemIndex) / maxItemIndex;
}

/** Rotation that places `itemIndex` at the rest zone (card #1 position). */
export function getZoneRotationForItemIndex(
  itemIndex: number,
  batchSize: number,
) {
  if (batchSize <= 0) {
    return 0;
  }

  return (mod(itemIndex, batchSize) * 360) / batchSize;
}

export function getSnappedCarouselStateForItemIndex(
  itemIndex: number,
  itemCount: number,
  batchSize: number,
) {
  return getCarouselStateFromItemPosition(itemIndex, itemCount, batchSize, true);
}

export function resolveZoneSnapItemIndex(
  itemPositionFloat: number,
  maxItemIndex: number,
) {
  if (maxItemIndex <= 0) {
    return 0;
  }

  const clampedPosition = clamp(itemPositionFloat, 0, maxItemIndex);
  let targetIndex = Math.round(clampedPosition);
  const pageEndSnapMinFloat = maxItemIndex - PAGE_END_SNAP_ZONE_FRACTION;

  if (targetIndex === maxItemIndex && clampedPosition < pageEndSnapMinFloat) {
    targetIndex = maxItemIndex - 1;
  }

  if (Math.abs(clampedPosition - targetIndex) > ZONE_SNAP_THRESHOLD) {
    return null;
  }

  return targetIndex;
}

/** Item index currently aligned to the zone, or nearest snap for stepping. */
export function resolveStepOriginItemIndex(
  itemPositionFloat: number,
  maxItemIndex: number,
) {
  const zoneSnapIndex = resolveZoneSnapItemIndex(
    itemPositionFloat,
    maxItemIndex,
  );

  if (zoneSnapIndex !== null) {
    return zoneSnapIndex;
  }

  return Math.round(clamp(itemPositionFloat, 0, maxItemIndex));
}
