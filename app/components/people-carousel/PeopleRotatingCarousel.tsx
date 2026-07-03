"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

import type { PeopleCarouselItem } from "./items";
import {
  findMemberIndexBySlug,
  getMemberPathFromIndex,
  parseMemberSlugFromPath,
} from "./memberPaths";

import "@/app/styles/people-carousel.css";

const CARD_GAP_PX = 0;
/** Scroll distance assigned to each card along the track. */
const SCROLL_VH_PER_CARD = 12;
const SNAP_IDLE_MS = 140;
const SNAP_DURATION_MS = 420;
/** Slight overshoot for a soft, elastic snap settle. */
const SNAP_EASE_OVERSHOOT = 0.82;
const MIN_CAROUSEL_RADIUS_PX = 180;
const RADIUS_SCALE = 0.7;
const CAROUSEL_SCALE = 0.96;
const VIEW_ROTATE_Y_DEG = 10;
const VIEW_ROTATE_X_DEG = 0;
const RIG_CENTER_OFFSET_X = "-4%";
const RIG_CENTER_OFFSET_Y = "-2%";
/** Default cylinder rotation when scroll progress is at the start of each batch. */
const INITIAL_ROTATION_OFFSET_DEG = 22;
/** Hover tilt for the card currently in the front zone (counter-rotate toward the viewer). */
const ZONE_HOVER_STAND_DEG = 14;
const ZONE_HOVER_LIFT_PX = 22;
const EXPANDED_CARD_WIDTH_PX = 1080;
const EXPANDED_CARD_HEIGHT_PX = 600;
const EXPAND_DURATION_MS = 520;
/** Cards shown on the cylinder per batch (e.g. 1–11, then 12–22). */
export const VISIBLE_CAROUSEL_SLOTS = 11;

type CardRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type ExpandRestPose = {
  displayRotation: number;
  zoneCardAngle: number;
  carouselRadius: number;
  carouselPerspective: number;
  stageWidth: number;
  stageHeight: number;
};

type ExpandAnchorMetrics = {
  bodyAnchorRect: CardRect;
  cardOrigin: { x: number; y: number };
};

type ExpandedCardState = {
  item: PeopleCarouselItem;
  itemIndex: number;
  restPose: ExpandRestPose;
  anchor: ExpandAnchorMetrics;
  /** Expand starts from hover stand-up when opened via zone click. */
  openWithHover: boolean;
  isOpen: boolean;
  isClosing: boolean;
  /** Waiting for hover settle before collapse. */
  pendingClose: boolean;
};

function captureExpandRestPose(
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

function getCarouselRigTransform() {
  return `translate(${RIG_CENTER_OFFSET_X}, ${RIG_CENTER_OFFSET_Y}) rotateY(${VIEW_ROTATE_Y_DEG}deg) rotateX(${VIEW_ROTATE_X_DEG}deg) scale(${CAROUSEL_SCALE})`;
}

function getCarouselSlotTransform(
  zoneCardAngle: number,
  carouselRadius: number,
) {
  return `rotateX(${zoneCardAngle}deg) translateZ(${carouselRadius}px)`;
}

function measureExpandAnchorMetrics(
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

function expandAnchorMetricsEqual(
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

function computeExpandAlignBaseRect(
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

function getExpandAlignTransform(
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

function domRectToCardRect(rect: DOMRect): CardRect {
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function getExpandedTargetRect(
  viewportWidth: number,
  viewportHeight: number,
): CardRect {
  const aspect = EXPANDED_CARD_WIDTH_PX / EXPANDED_CARD_HEIGHT_PX;
  const horizontalPadding = 48;
  const verticalPadding = 48;
  const maxWidth = Math.min(EXPANDED_CARD_WIDTH_PX, viewportWidth - horizontalPadding);
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

function getExpandedTargetRectFallback(): CardRect {
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

function PeopleCarouselCardContent({ item }: { item: PeopleCarouselItem }) {
  return (
    <>
      {item.role ? (
        <span className="people-carousel-card__role">{item.role}</span>
      ) : null}
      <span className="people-carousel-card__label">{item.name}</span>
    </>
  );
}

function getCarouselRadius(
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

  return Math.ceil(((projectedCardSpan + CARD_GAP_PX) / angleStepRad) * RADIUS_SCALE);
}

function getCarouselPerspective(radiusPx: number) {
  return Math.max(Math.ceil(radiusPx * 2.8), 960);
}

type PeopleRotatingCarouselProps = {
  items: PeopleCarouselItem[];
  className?: string;
  header?: ReactNode;
  /** Opens the matching member when visiting `/peoplepage/[memberId]` directly. */
  initialMemberSlug?: string;
};

function mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeOutBack(t: number, overshoot = SNAP_EASE_OVERSHOOT) {
  const c3 = overshoot + 1;

  return 1 + c3 * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
}


function getBatchCount(itemCount: number, batchSize: number) {
  if (itemCount <= 0 || batchSize <= 0) {
    return 0;
  }

  return Math.ceil(itemCount / batchSize);
}

function getActiveSlotInBatch(rotation: number, batchSize: number) {
  if (batchSize <= 0) {
    return 0;
  }

  const slotStep = 360 / batchSize;
  const normalized = mod(rotation, 360);

  return Math.round(normalized / slotStep) % batchSize;
}

function getCarouselStateFromItemPosition(
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

  const batchIndex = Math.floor(clampedPosition / batchSize);
  const slotFloat = clampedPosition - batchIndex * batchSize;
  const rotation = slotFloat * (360 / batchSize);
  const itemIndex = Math.round(clampedPosition);

  return { itemIndex, batchIndex, rotation };
}

function getScrollMetrics(track: HTMLElement) {
  const trackTop = track.offsetTop;
  const loopHeight = track.offsetHeight - window.innerHeight;

  return { trackTop, loopHeight };
}

export default function PeopleRotatingCarousel({
  items,
  className = "",
  header,
  initialMemberSlug,
}: PeopleRotatingCarouselProps) {
  const trackRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const zoneCardRef = useRef<HTMLElement>(null);
  const zoneCardSurfaceRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const isClampingScrollRef = useRef(false);
  const isSnapAnimatingRef = useRef(false);
  const snapAnimFrameRef = useRef<number | null>(null);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rotation, setRotation] = useState(0);
  const [batchIndex, setBatchIndex] = useState(0);
  const [carouselRadius, setCarouselRadius] = useState(MIN_CAROUSEL_RADIUS_PX);

  const batchCount = useMemo(
    () => getBatchCount(items.length, VISIBLE_CAROUSEL_SLOTS),
    [items.length],
  );

  const slotAngleStep = useMemo(
    () => (VISIBLE_CAROUSEL_SLOTS > 0 ? 360 / VISIBLE_CAROUSEL_SLOTS : 0),
    [],
  );

  const batchStartIndex = batchIndex * VISIBLE_CAROUSEL_SLOTS;

  const displayRotation = rotation + INITIAL_ROTATION_OFFSET_DEG;

  /** Slot aligned to the snap position (derived from scroll rotation, not display offset). */
  const snapSlotInBatch = useMemo(() => {
    if (VISIBLE_CAROUSEL_SLOTS <= 0 || slotAngleStep <= 0) {
      return 0;
    }

    return mod(Math.round(rotation / slotAngleStep), VISIBLE_CAROUSEL_SLOTS);
  }, [rotation, slotAngleStep]);

  const activeSlotInBatch = useMemo(
    () => getActiveSlotInBatch(displayRotation, VISIBLE_CAROUSEL_SLOTS),
    [displayRotation],
  );

  /** Cylinder slot at the snap position — the interactive zone (card 1 position). */
  const zoneSlotInBatch = snapSlotInBatch;

  const [isZoneHovered, setIsZoneHovered] = useState(false);
  const [expandedCard, setExpandedCard] = useState<ExpandedCardState | null>(null);
  const [expandedTargetRect, setExpandedTargetRect] = useState<CardRect | null>(
    null,
  );
  const [liveBodyAnchorRect, setLiveBodyAnchorRect] = useState<CardRect | null>(
    null,
  );
  const expandCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expandOpenFrameRef = useRef<number | null>(null);
  const expandAlignRef = useRef<HTMLDivElement>(null);
  const [expandTransformOrigin, setExpandTransformOrigin] = useState("50% 50%");
  const [expandAlignLayoutRect, setExpandAlignLayoutRect] = useState<CardRect | null>(
    null,
  );
  const [expandOverlayReady, setExpandOverlayReady] = useState(false);
  const pendingExpandSyncRef = useRef<number | null>(null);
  const isHistorySyncRef = useRef(false);
  const pendingInitialSlugRef = useRef(initialMemberSlug ?? null);
  const expandOpenSessionRef = useRef<number | null>(null);
  const zoneItemIndex = Math.min(
    batchStartIndex + zoneSlotInBatch,
    Math.max(items.length - 1, 0),
  );

  const zoneItem = items[zoneItemIndex];

  const updateExpandedTargetRect = useCallback(() => {
    setExpandedTargetRect(
      getExpandedTargetRect(window.innerWidth, window.innerHeight),
    );
  }, []);

  const clearExpandTimers = useCallback(() => {
    if (expandOpenFrameRef.current !== null) {
      window.cancelAnimationFrame(expandOpenFrameRef.current);
      expandOpenFrameRef.current = null;
    }

    if (expandCloseTimerRef.current !== null) {
      clearTimeout(expandCloseTimerRef.current);
      expandCloseTimerRef.current = null;
    }
  }, []);

  const [zoneHitRect, setZoneHitRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const updateZoneHitRect = useCallback(() => {
    const zoneCard = zoneCardRef.current;
    const body = bodyRef.current;

    if (!zoneCard || !body) {
      setZoneHitRect(null);
      return;
    }

    const cardRect = zoneCard.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();

    setZoneHitRect({
      top: cardRect.top - bodyRect.top,
      left: cardRect.left - bodyRect.left,
      width: cardRect.width,
      height: cardRect.height,
    });
  }, []);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      updateZoneHitRect();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    batchIndex,
    carouselRadius,
    displayRotation,
    updateZoneHitRect,
    zoneSlotInBatch,
  ]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsZoneHovered(false);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [zoneSlotInBatch, batchIndex]);

  useEffect(() => {
    window.addEventListener("scroll", updateZoneHitRect, { passive: true });
    window.addEventListener("resize", updateZoneHitRect);

    return () => {
      window.removeEventListener("scroll", updateZoneHitRect);
      window.removeEventListener("resize", updateZoneHitRect);
    };
  }, [updateZoneHitRect]);

  const activeIndex = Math.min(
    batchStartIndex + activeSlotInBatch,
    Math.max(items.length - 1, 0),
  );

  const activeItem = items[activeIndex];

  const carouselPerspective = useMemo(
    () => getCarouselPerspective(carouselRadius),
    [carouselRadius],
  );

  const updateCarouselRadius = useCallback(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    setCarouselRadius(
      getCarouselRadius(
        stage.offsetHeight,
        stage.offsetWidth,
        VISIBLE_CAROUSEL_SLOTS,
      ),
    );
  }, []);

  useLayoutEffect(() => {
    updateCarouselRadius();
  }, [updateCarouselRadius]);

  useEffect(() => {
    window.addEventListener("resize", updateCarouselRadius);

    return () => {
      window.removeEventListener("resize", updateCarouselRadius);
    };
  }, [updateCarouselRadius]);

  const applyCarouselState = useCallback(
    (batchIndex: number, rotation: number) => {
      setBatchIndex(batchIndex);
      setRotation(rotation);
    },
    [],
  );

  const scrollToItemIndex = useCallback(
    (itemIndex: number) => {
      const track = trackRef.current;

      if (!track || items.length <= 1) {
        return;
      }

      const { trackTop, loopHeight } = getScrollMetrics(track);

      if (loopHeight <= 0) {
        return;
      }

      const scrollY = trackTop + (itemIndex / (items.length - 1)) * loopHeight;
      window.scrollTo(0, scrollY);

      const { batchIndex: nextBatchIndex, rotation: nextRotation } =
        getCarouselStateFromItemPosition(
          itemIndex,
          items.length,
          VISIBLE_CAROUSEL_SLOTS,
          true,
        );

      applyCarouselState(nextBatchIndex, nextRotation);
    },
    [applyCarouselState, items.length],
  );

  const pushMemberUrl = useCallback((itemIndex: number) => {
    if (typeof window === "undefined") {
      return;
    }

    const nextPath = getMemberPathFromIndex(itemIndex);

    if (window.location.pathname === nextPath) {
      return;
    }

    isHistorySyncRef.current = true;
    window.history.pushState({ peopleMember: nextPath }, "", nextPath);
  }, []);

  const beginExpandedCardAtIndex = useCallback(
    (
      itemIndex: number,
      options?: { syncHistory?: boolean; openWithHover?: boolean },
    ) => {
      if (itemIndex < 0 || itemIndex >= items.length || expandedCard) {
        return;
      }

      const syncHistory = options?.syncHistory ?? true;
      const openWithHover = options?.openWithHover ?? false;
      const anchor = measureExpandAnchorMetrics(
        bodyRef.current,
        zoneCardSurfaceRef.current,
      );

      if (!anchor) {
        return;
      }

      const restPose = captureExpandRestPose(
        stageRef.current,
        displayRotation,
        zoneSlotInBatch,
        slotAngleStep,
        carouselRadius,
        carouselPerspective,
      );

      clearExpandTimers();
      updateExpandedTargetRect();
      setLiveBodyAnchorRect(anchor.bodyAnchorRect);
      setExpandAlignLayoutRect(null);
      setExpandOverlayReady(false);
      setExpandTransformOrigin("50% 50%");
      expandOpenSessionRef.current = null;

      setExpandedCard({
        item: items[itemIndex],
        itemIndex,
        restPose,
        anchor,
        openWithHover,
        isOpen: false,
        isClosing: false,
        pendingClose: false,
      });

      if (syncHistory) {
        pendingExpandSyncRef.current = itemIndex;
      }
    },
    [
      carouselPerspective,
      carouselRadius,
      clearExpandTimers,
      displayRotation,
      expandedCard,
      items,
      slotAngleStep,
      updateExpandedTargetRect,
      zoneSlotInBatch,
    ],
  );

  const closeExpandedCard = useCallback(
    (options?: { syncHistory?: boolean }) => {
      const syncHistory = options?.syncHistory ?? true;

      setIsZoneHovered(false);

      setExpandedCard((previous) => {
        if (!previous || previous.isClosing || previous.pendingClose) {
          return previous;
        }

        return {
          ...previous,
          pendingClose: true,
        };
      });

      if (
        syncHistory &&
        typeof window !== "undefined" &&
        parseMemberSlugFromPath(window.location.pathname)
      ) {
        isHistorySyncRef.current = true;
        window.history.back();
      }
    },
    [],
  );

  const openExpandedCard = useCallback(() => {
    if (!isZoneHovered || expandedCard || !zoneItem) {
      return;
    }

    beginExpandedCardAtIndex(zoneItemIndex, { openWithHover: true });
  }, [
    beginExpandedCardAtIndex,
    expandedCard,
    isZoneHovered,
    zoneItem,
    zoneItemIndex,
  ]);

  const openExpandedCardFromSlug = useCallback(
    (slug: string, options?: { syncHistory?: boolean }) => {
      const itemIndex = findMemberIndexBySlug(items.length, slug);

      if (itemIndex === -1) {
        return;
      }

      scrollToItemIndex(itemIndex);

      requestAnimationFrame(() => {
        if (expandedCard?.itemIndex === itemIndex && expandedCard.isOpen) {
          return;
        }

        clearExpandTimers();
        setExpandedCard(null);

        requestAnimationFrame(() => {
          beginExpandedCardAtIndex(itemIndex, {
            ...options,
            openWithHover: false,
          });
        });
      });
    },
    [
      beginExpandedCardAtIndex,
      clearExpandTimers,
      expandedCard,
      items.length,
      scrollToItemIndex,
    ],
  );

  useLayoutEffect(() => {
    if (!expandedCard?.pendingClose || expandedCard.isClosing) {
      return;
    }

    const surface = zoneCardSurfaceRef.current;
    const HOVER_SETTLE_MS = 400;

    const beginCloseAnimation = () => {
      const freshAnchor = measureExpandAnchorMetrics(
        bodyRef.current,
        zoneCardSurfaceRef.current,
      );

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setExpandedCard((previous) =>
            previous?.pendingClose
              ? {
                  ...previous,
                  anchor: freshAnchor ?? previous.anchor,
                  restPose: captureExpandRestPose(
                    stageRef.current,
                    displayRotation,
                    zoneSlotInBatch,
                    slotAngleStep,
                    carouselRadius,
                    carouselPerspective,
                  ),
                  pendingClose: false,
                  isOpen: false,
                  isClosing: true,
                }
              : previous,
          );

          if (freshAnchor) {
            setLiveBodyAnchorRect(freshAnchor.bodyAnchorRect);
          }
        });
      });
    };

    if (!surface) {
      beginCloseAnimation();
      return;
    }

    let settled = false;

    const finishPendingClose = () => {
      if (settled) {
        return;
      }

      settled = true;
      surface.removeEventListener("transitionend", onTransitionEnd);
      beginCloseAnimation();
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== surface || event.propertyName !== "transform") {
        return;
      }

      finishPendingClose();
    };

    surface.addEventListener("transitionend", onTransitionEnd);
    const fallbackTimer = window.setTimeout(finishPendingClose, HOVER_SETTLE_MS);

    return () => {
      settled = true;
      surface.removeEventListener("transitionend", onTransitionEnd);
      window.clearTimeout(fallbackTimer);
    };
  }, [
    carouselPerspective,
    carouselRadius,
    displayRotation,
    expandedCard?.isClosing,
    expandedCard?.pendingClose,
    slotAngleStep,
    zoneSlotInBatch,
  ]);

  useEffect(() => {
    if (!expandedCard?.isClosing) {
      return;
    }

    if (expandCloseTimerRef.current !== null) {
      return;
    }

    expandCloseTimerRef.current = setTimeout(() => {
      expandCloseTimerRef.current = null;
      expandOpenSessionRef.current = null;
      setExpandedCard(null);
      setLiveBodyAnchorRect(null);
      setExpandAlignLayoutRect(null);
      setExpandOverlayReady(false);
    }, EXPAND_DURATION_MS);

    return () => {
      if (expandCloseTimerRef.current !== null) {
        clearTimeout(expandCloseTimerRef.current);
        expandCloseTimerRef.current = null;
      }
    };
  }, [expandedCard?.isClosing, expandedCard?.itemIndex]);

  useLayoutEffect(() => {
    if (
      !expandedCard ||
      expandedCard.isOpen ||
      expandedCard.isClosing ||
      expandedCard.pendingClose
    ) {
      return;
    }

    if (expandOpenSessionRef.current === expandedCard.itemIndex) {
      return;
    }

    expandOpenSessionRef.current = expandedCard.itemIndex;

    const freshAnchor = measureExpandAnchorMetrics(
      bodyRef.current,
      zoneCardSurfaceRef.current,
    );

    if (freshAnchor) {
      setExpandedCard((previous) => {
        if (
          !previous ||
          previous.isOpen ||
          previous.isClosing ||
          previous.pendingClose
        ) {
          return previous;
        }

        if (expandAnchorMetricsEqual(previous.anchor, freshAnchor)) {
          return previous;
        }

        return { ...previous, anchor: freshAnchor };
      });
      setLiveBodyAnchorRect((previous) => {
        const next = freshAnchor.bodyAnchorRect;

        if (
          previous &&
          previous.top === next.top &&
          previous.left === next.left &&
          previous.width === next.width &&
          previous.height === next.height
        ) {
          return previous;
        }

        return next;
      });
    }

    setExpandOverlayReady((previous) => (previous ? previous : true));

    const measureExpandOrigin = () => {
      const alignElement = expandAlignRef.current;
      const zoneSurface = zoneCardSurfaceRef.current;

      if (!alignElement || !zoneSurface) {
        return;
      }

      const alignRect = alignElement.getBoundingClientRect();
      const surfaceRect = zoneSurface.getBoundingClientRect();

      setExpandAlignLayoutRect(domRectToCardRect(alignRect));
      setExpandTransformOrigin(
        `${surfaceRect.left + surfaceRect.width / 2 - alignRect.left}px ${surfaceRect.top + surfaceRect.height / 2 - alignRect.top}px`,
      );
    };

    measureExpandOrigin();

    const openFrame = window.requestAnimationFrame(() => {
      measureExpandOrigin();
      expandOpenFrameRef.current = window.requestAnimationFrame(() => {
        measureExpandOrigin();
        expandOpenFrameRef.current = null;
        setExpandedCard((previous) =>
          previous && !previous.isOpen
            ? { ...previous, isOpen: true }
            : previous,
        );

        if (pendingExpandSyncRef.current !== null) {
          pushMemberUrl(pendingExpandSyncRef.current);
          pendingExpandSyncRef.current = null;
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(openFrame);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- omit expandedCard object to avoid expand open loop
  }, [
    expandedCard?.isClosing,
    expandedCard?.isOpen,
    expandedCard?.itemIndex,
    expandedCard?.pendingClose,
    pushMemberUrl,
  ]);

  useLayoutEffect(() => {
    if (!expandedCard) {
      return;
    }

    const syncBodyAnchor = () => {
      const body = bodyRef.current;

      if (!body) {
        return;
      }

      setLiveBodyAnchorRect(domRectToCardRect(body.getBoundingClientRect()));
    };

    syncBodyAnchor();
    window.addEventListener("scroll", syncBodyAnchor, { passive: true });
    window.addEventListener("resize", syncBodyAnchor);

    return () => {
      window.removeEventListener("scroll", syncBodyAnchor);
      window.removeEventListener("resize", syncBodyAnchor);
    };
  }, [expandedCard]);

  useEffect(() => {
    return () => {
      clearExpandTimers();
    };
  }, [clearExpandTimers]);

  useEffect(() => {
    if (!expandedCard) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeExpandedCard();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updateExpandedTargetRect);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updateExpandedTargetRect);
    };
  }, [closeExpandedCard, expandedCard, updateExpandedTargetRect]);

  useEffect(() => {
    const onPopState = () => {
      if (isHistorySyncRef.current) {
        isHistorySyncRef.current = false;
        return;
      }

      const slug = parseMemberSlugFromPath(window.location.pathname);

      if (!slug) {
        closeExpandedCard({ syncHistory: false });
        return;
      }

      openExpandedCardFromSlug(slug, { syncHistory: false });
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [closeExpandedCard, openExpandedCardFromSlug]);

  useEffect(() => {
    const slug = pendingInitialSlugRef.current;

    if (!slug) {
      return;
    }

    pendingInitialSlugRef.current = null;
    openExpandedCardFromSlug(slug, { syncHistory: false });
  }, [initialMemberSlug, openExpandedCardFromSlug]);

  const cancelSnapAnimation = useCallback(() => {
    if (snapAnimFrameRef.current !== null) {
      window.cancelAnimationFrame(snapAnimFrameRef.current);
      snapAnimFrameRef.current = null;
    }

    isSnapAnimatingRef.current = false;
  }, []);

  const applyRotationFromScrollProgress = useCallback(
    (progress: number) => {
      const itemPosition = progress * (items.length - 1);
      const { batchIndex: nextBatchIndex, rotation: nextRotation } =
        getCarouselStateFromItemPosition(
          itemPosition,
          items.length,
          VISIBLE_CAROUSEL_SLOTS,
          false,
        );

      applyCarouselState(nextBatchIndex, nextRotation);
    },
    [applyCarouselState, items.length],
  );

  const animateSnapToItemIndex = useCallback(
    (targetItemIndex: number, trackTop: number, loopHeight: number) => {
      cancelSnapAnimation();

      const startScrollY = window.scrollY;
      const targetScrollY =
        trackTop + (targetItemIndex / (items.length - 1)) * loopHeight;
      const startProgress = clamp((startScrollY - trackTop) / loopHeight, 0, 1);
      const targetProgress = targetItemIndex / (items.length - 1);
      const animationStart = performance.now();

      isSnapAnimatingRef.current = true;

      const tick = (now: number) => {
        const elapsed = now - animationStart;
        const linearT = clamp(elapsed / SNAP_DURATION_MS, 0, 1);
        const easedT = easeOutBack(linearT);
        const nextProgress = clamp(
          startProgress + (targetProgress - startProgress) * easedT,
          0,
          1,
        );
        const nextScrollY = trackTop + nextProgress * loopHeight;

        window.scrollTo(0, nextScrollY);
        applyRotationFromScrollProgress(nextProgress);

        if (linearT < 1) {
          snapAnimFrameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        window.scrollTo(0, targetScrollY);

        const { batchIndex: nextBatchIndex, rotation: nextRotation } =
          getCarouselStateFromItemPosition(
            targetItemIndex,
            items.length,
            VISIBLE_CAROUSEL_SLOTS,
            true,
          );

        applyCarouselState(nextBatchIndex, nextRotation);
        isSnapAnimatingRef.current = false;
        snapAnimFrameRef.current = null;
      };

      snapAnimFrameRef.current = window.requestAnimationFrame(tick);
    },
    [applyCarouselState, applyRotationFromScrollProgress, cancelSnapAnimation, items.length],
  );

  const updateRotationFromScroll = useCallback(
    (snapToCard = false) => {
      const track = trackRef.current;

      if (!track || items.length <= 1 || batchCount <= 0) {
        return;
      }

      if (isSnapAnimatingRef.current) {
        return;
      }

      const { trackTop, loopHeight } = getScrollMetrics(track);

      if (loopHeight <= 0) {
        applyCarouselState(0, 0);
        return;
      }

      if (isClampingScrollRef.current) {
        return;
      }

      let scrolled = window.scrollY - trackTop;

      if (scrolled > loopHeight) {
        isClampingScrollRef.current = true;
        window.scrollTo(0, trackTop + loopHeight);
        scrolled = loopHeight;
        requestAnimationFrame(() => {
          isClampingScrollRef.current = false;
        });
      } else if (scrolled < 0) {
        isClampingScrollRef.current = true;
        window.scrollTo(0, trackTop);
        scrolled = 0;
        requestAnimationFrame(() => {
          isClampingScrollRef.current = false;
        });
      }

      const progress = clamp(scrolled / loopHeight, 0, 1);

      if (snapToCard) {
        const targetItemIndex = Math.round(progress * (items.length - 1));
        const targetScrollY =
          trackTop + (targetItemIndex / (items.length - 1)) * loopHeight;

        if (Math.abs(window.scrollY - targetScrollY) <= 1) {
          const { batchIndex: nextBatchIndex, rotation: nextRotation } =
            getCarouselStateFromItemPosition(
              targetItemIndex,
              items.length,
              VISIBLE_CAROUSEL_SLOTS,
              true,
            );

          applyCarouselState(nextBatchIndex, nextRotation);
          return;
        }

        animateSnapToItemIndex(targetItemIndex, trackTop, loopHeight);
        return;
      }

      applyRotationFromScrollProgress(progress);
    },
    [
      animateSnapToItemIndex,
      applyCarouselState,
      applyRotationFromScrollProgress,
      batchCount,
      items.length,
    ],
  );

  const snapToNearestCard = useCallback(() => {
    updateRotationFromScroll(true);
  }, [updateRotationFromScroll]);

  const scheduleSnapToNearestCard = useCallback(() => {
    if (snapTimerRef.current) {
      clearTimeout(snapTimerRef.current);
    }

    snapTimerRef.current = setTimeout(() => {
      snapTimerRef.current = null;
      snapToNearestCard();
    }, SNAP_IDLE_MS);
  }, [snapToNearestCard]);

  useEffect(() => {
    const onScroll = () => {
      if (isSnapAnimatingRef.current) {
        return;
      }

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        updateRotationFromScroll(false);
      });

      scheduleSnapToNearestCard();
    };

    const onScrollEnd = () => {
      if (snapTimerRef.current) {
        clearTimeout(snapTimerRef.current);
        snapTimerRef.current = null;
      }

      snapToNearestCard();
    };

    const initFrame = requestAnimationFrame(() => {
      updateRotationFromScroll(false);
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(initFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", onScroll);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      cancelSnapAnimation();

      if (snapTimerRef.current) {
        clearTimeout(snapTimerRef.current);
        snapTimerRef.current = null;
      }
    };
  }, [
    cancelSnapAnimation,
    scheduleSnapToNearestCard,
    snapToNearestCard,
    updateRotationFromScroll,
  ]);

  const visibleSlots = useMemo(() => {
    const startIndex = batchIndex * VISIBLE_CAROUSEL_SLOTS;

    return Array.from({ length: VISIBLE_CAROUSEL_SLOTS }, (_, slotIndex) => {
      const itemIndex = startIndex + slotIndex;

      if (itemIndex >= items.length) {
        return null;
      }

      const item = items[itemIndex];

      return {
        slotIndex,
        item,
        itemIndex,
        isActive: slotIndex === activeSlotInBatch,
        isInZone: slotIndex === zoneSlotInBatch,
        angle: -slotIndex * slotAngleStep,
      };
    }).filter((slot): slot is NonNullable<typeof slot> => slot !== null);
  }, [activeSlotInBatch, batchIndex, items, slotAngleStep, zoneSlotInBatch]);

  const scrollTrackHeight =
    items.length > 0 ? `${items.length * SCROLL_VH_PER_CARD}vh` : "100vh";

  const expandedTargetLayoutRect =
    expandedTargetRect ?? getExpandedTargetRectFallback();

  const expandIsOpen = Boolean(
    expandedCard?.isOpen && !expandedCard?.isClosing,
  );

  const expandIsClosing = Boolean(expandedCard?.isClosing);

  const expandRestPose = expandedCard?.restPose;
  const expandAnchor = expandedCard?.anchor;
  const bodyAnchorRect =
    liveBodyAnchorRect ?? expandAnchor?.bodyAnchorRect ?? null;

  const computedExpandAlignBaseRect = useMemo(() => {
    if (!bodyAnchorRect || !expandRestPose) {
      return null;
    }

    const paddingTop = 16;
    const paddingBottom = 80;

    return computeExpandAlignBaseRect(
      bodyAnchorRect,
      expandRestPose.stageWidth,
      expandRestPose.stageHeight,
      paddingTop,
      paddingBottom,
    );
  }, [bodyAnchorRect, expandRestPose]);

  const expandAlignBaseRect =
    expandAlignLayoutRect ?? computedExpandAlignBaseRect;

  const expandAlignTransform =
    expandAlignBaseRect && expandRestPose && expandIsOpen
      ? getExpandAlignTransform(
          expandAlignBaseRect,
          expandRestPose.stageWidth,
          expandRestPose.stageHeight,
          expandedTargetLayoutRect,
        )
      : "none";

  const expandTransformOriginValue =
    expandIsOpen || expandIsClosing ? "50% 50%" : expandTransformOrigin;

  const expandShowHoverSurface = Boolean(
    expandedCard?.openWithHover &&
      !expandIsOpen &&
      !expandIsClosing &&
      !expandedCard?.pendingClose,
  );

  const expandCarouselRigTransform = getCarouselRigTransform();
  const expandCarouselStageTransform = expandRestPose
    ? `rotateX(${expandRestPose.displayRotation}deg)`
    : undefined;
  const expandCarouselSlotTransform = expandRestPose
    ? getCarouselSlotTransform(
        expandRestPose.zoneCardAngle,
        expandRestPose.carouselRadius,
      )
    : undefined;
  const expandUseCarouselPose = !expandIsOpen;

  const expandShouldAnimate = expandIsOpen || expandIsClosing;

  return (
    <section
      ref={trackRef}
      className={["people-carousel-scroll-track", className]
        .filter(Boolean)
        .join(" ")}
      style={{ height: scrollTrackHeight }}
      aria-roledescription="carousel"
      aria-label="People carousel"
    >
      <div className="people-carousel-wrap">
        {header ? (
          <div className="people-carousel-header">{header}</div>
        ) : null}

        <div
          ref={bodyRef}
          className="people-carousel-body"
          style={{ perspective: `${carouselPerspective}px` }}
        >
          <div
            className="people-carousel-rig"
            style={{ transform: getCarouselRigTransform() }}
          >
            <div
              ref={stageRef}
              className="people-carousel-stage"
              style={{ transform: `rotateX(${displayRotation}deg)` }}
            >
              {visibleSlots.map(({ slotIndex, item, itemIndex, isActive, isInZone, angle }) => (
                <article
                  key={`${batchIndex}-${slotIndex}`}
                  ref={isInZone ? zoneCardRef : undefined}
                  className="people-carousel-card"
                  style={{
                    transform: `rotateX(${angle}deg) translateZ(${carouselRadius}px)`,
                  }}
                  aria-hidden={!isActive}
                >
                  <div
                    ref={isInZone ? zoneCardSurfaceRef : undefined}
                    className={[
                      "people-carousel-card__surface",
                      isInZone ? "people-carousel-card__surface--in-zone" : "",
                      isInZone && isZoneHovered
                        ? "people-carousel-card__surface--in-zone-hovered"
                        : "",
                      isInZone && expandedCard?.itemIndex === itemIndex && expandOverlayReady
                        ? "people-carousel-card__surface--source-hidden"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={
                      isInZone
                        ? ({
                            "--zone-hover-stand-deg": `${ZONE_HOVER_STAND_DEG}deg`,
                            "--zone-hover-lift-px": `${ZONE_HOVER_LIFT_PX}px`,
                          } as CSSProperties)
                        : undefined
                    }
                  >
                    <PeopleCarouselCardContent item={item} />
                  </div>
                </article>
              ))}
            </div>
          </div>

          {zoneHitRect && !expandedCard ? (
            <button
              type="button"
              className="people-carousel-zone-hit"
              style={{
                top: zoneHitRect.top,
                left: zoneHitRect.left,
                width: zoneHitRect.width,
                height: zoneHitRect.height,
              }}
              onPointerEnter={() => setIsZoneHovered(true)}
              onPointerLeave={() => setIsZoneHovered(false)}
              onClick={openExpandedCard}
              aria-label={
                zoneItem ? `Expand ${zoneItem.name}` : "Expand member card"
              }
            />
          ) : null}
        </div>
      </div>

      {expandedCard && bodyAnchorRect && expandAnchor && expandRestPose
        ? createPortal(
            <div
              className={[
                "people-carousel-expand",
                "people-carousel-expand--visible",
                expandIsOpen || expandIsClosing
                  ? "people-carousel-expand--open"
                  : "",
                expandIsClosing ? "people-carousel-expand--closing" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                type="button"
                className="people-carousel-expand__backdrop"
                onClick={() => closeExpandedCard()}
                aria-label="Close expanded card"
              />
              <div
                className="people-carousel-expand-3d-root"
                style={{
                  top: bodyAnchorRect.top,
                  left: bodyAnchorRect.left,
                  width: bodyAnchorRect.width,
                  height: bodyAnchorRect.height,
                  perspective: `${expandRestPose.carouselPerspective}px`,
                }}
                role="dialog"
                aria-modal="true"
                aria-label={expandedCard.item.name}
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  ref={expandAlignRef}
                  className={[
                    "people-carousel-expand-align",
                    expandShouldAnimate
                      ? "people-carousel-expand-align--animate"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    transformOrigin: expandTransformOriginValue,
                    transform: expandAlignTransform,
                  }}
                >
                  <div
                    className={[
                      "people-carousel-rig",
                      "people-carousel-expand-layer",
                      expandShouldAnimate
                        ? "people-carousel-expand-layer--animate"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      transform: expandUseCarouselPose
                        ? expandCarouselRigTransform
                        : "none",
                    }}
                  >
                    <div
                      className={[
                        "people-carousel-stage",
                        "people-carousel-expand-layer",
                        expandShouldAnimate
                          ? "people-carousel-expand-layer--animate"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        width: expandRestPose.stageWidth || undefined,
                        height: expandRestPose.stageHeight || undefined,
                        transform: expandUseCarouselPose
                          ? expandCarouselStageTransform
                          : "none",
                      }}
                    >
                      <article
                        className={[
                          "people-carousel-card",
                          "people-carousel-expand-layer",
                          expandShouldAnimate
                            ? "people-carousel-expand-layer--animate"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{
                          transform: expandUseCarouselPose
                            ? expandCarouselSlotTransform
                            : "none",
                        }}
                      >
                        <div
                          className={[
                            "people-carousel-card__surface",
                            "people-carousel-card__surface--in-zone",
                            expandShowHoverSurface
                              ? "people-carousel-card__surface--in-zone-hovered"
                              : "",
                            expandIsOpen
                              ? "people-carousel-expand__surface--open"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={
                            expandShowHoverSurface
                              ? ({
                                  "--zone-hover-stand-deg": `${ZONE_HOVER_STAND_DEG}deg`,
                                  "--zone-hover-lift-px": `${ZONE_HOVER_LIFT_PX}px`,
                                } as CSSProperties)
                              : undefined
                          }
                        >
                          <PeopleCarouselCardContent item={expandedCard.item} />
                        </div>
                      </article>
                    </div>
                  </div>
                </div>
              </div>
              {expandIsOpen ? (
                <button
                  type="button"
                  className="people-carousel-expand__close"
                  style={{
                    top: expandedTargetLayoutRect.top + 16,
                    left:
                      expandedTargetLayoutRect.left +
                      expandedTargetLayoutRect.width -
                      52,
                  }}
                  onClick={() => closeExpandedCard()}
                  aria-label="Close expanded card"
                >
                  ×
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}

      <p className="sr-only" aria-live="polite">
        {activeItem
          ? `${activeItem.name}${activeItem.role ? `, ${activeItem.role}` : ""}`
          : ""}
      </p>
    </section>
  );
}
