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

import { clamp } from "@/app/utils/numbers";
import { normalizeWheelDelta } from "@/app/utils/wheel";
import type { PeopleCarouselItem } from "./items";
import { PeopleCarouselCardSurface } from "./PeopleCarouselCard";
import PeopleCarouselExpandedPortal from "./PeopleCarouselExpandedPortal";
import {
  findMemberIndexBySlug,
  parseMemberSlugFromPath,
} from "./memberPaths";
import {
  correctPeopleFooterHandoffScroll,
  isInPeopleFooterHandoffZone,
  isPeopleCarouselScrollLockedByFooter,
  notifyPeopleCarouselProgrammaticStep,
} from "./peopleCarouselFooter";
import {
  captureExpandRestPose,
  CAROUSEL_ENTRY_DURATION_MS,
  computeExpandAlignBaseRect,
  domRectToCardRect,
  easeOutBack,
  expandAnchorMetricsEqual,
  EXPAND_DURATION_MS,
  EXPAND_MORPH_TRANSFORM_END_COUNT,
  getBatchCount,
  getCarouselPerspective,
  getCarouselRigTransform,
  getCarouselSlotTransform,
  getCarouselStateFromItemPosition,
  getExpandAlignTransform,
  getExpandedTargetRect,
  getExpandedTargetRectFallback,
  getScrollMetrics,
  getScrollProgressForItemIndex,
  getSnappedCarouselStateForItemIndex,
  resolveStepOriginItemIndex,
  INITIAL_ROTATION_OFFSET_DEG,
  isLikelyDiscreteMouseWheel,
  isSlotInGlassEffectWindow,
  measureExpandAnchorMetrics,
  mod,
  resolveZoneSnapItemIndex,
  SCROLL_VH_PER_CARD,
  SNAP_DURATION_MS,
  SNAP_POSITION_TOLERANCE_PX,
  type CardRect,
  type CarouselEntryPhase,
  type ExpandedCardState,
  VISIBLE_CAROUSEL_SLOTS,
  WHEEL_GESTURE_RELEASE_MS,
  ZONE_HOVER_LIFT_PX,
  ZONE_HOVER_STAND_DEG,
} from "./peopleCarouselModel";
import { usePeopleCarouselMeasurements } from "./usePeopleCarouselMeasurements";
import {
  pushPeopleMemberUrl,
  usePeopleCarouselRouteSync,
} from "./usePeopleCarouselRouteSync";
import { registerPeopleCarouselWheelSnapListeners } from "./peopleCarouselWheelSnapEvents";
import "@/app/styles/people-carousel.css";

type PeopleRotatingCarouselProps = {
  items: PeopleCarouselItem[];
  className?: string;
  header?: ReactNode;
  /** Opens the matching member when visiting `/peoplepage/[memberId]` directly. */
  initialMemberSlug?: string;
};

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
  const wheelGestureConsumedRef = useRef(false);
  const wheelGestureReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const carouselScrollIdleRef = useRef(true);
  const lastFooterHandoffWheelScrollYRef = useRef<number | null>(null);
  const programmaticStepRef = useRef(false);
  const programmaticTargetIndexRef = useRef<number | null>(null);

  const [rotation, setRotation] = useState(0);
  const [batchIndex, setBatchIndex] = useState(0);
  const [entryPhase, setEntryPhase] = useState<CarouselEntryPhase>(
    initialMemberSlug ? "complete" : "before",
  );

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

  /** Slot aligned to the rest zone where card #1 sits on first page load. */
  const zoneSlotInBatch = useMemo(() => {
    if (VISIBLE_CAROUSEL_SLOTS <= 0 || slotAngleStep <= 0) {
      return 0;
    }

    return mod(Math.round(rotation / slotAngleStep), VISIBLE_CAROUSEL_SLOTS);
  }, [rotation, slotAngleStep]);

  const activeSlotInBatch = zoneSlotInBatch;

  const { carouselRadius, zoneHitRect, updateZoneHitRect } =
    usePeopleCarouselMeasurements({
      bodyRef,
      stageRef,
      zoneCardRef,
      batchIndex,
      displayRotation,
      zoneSlotInBatch,
    });

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
  const expand3dRootRef = useRef<HTMLDivElement>(null);
  const expandSurfaceRef = useRef<HTMLDivElement>(null);
  const expandCloseHandoffFrameRef = useRef<number | null>(null);
  const [expandTransformOrigin, setExpandTransformOrigin] = useState("50% 50%");
  const [expandAlignLayoutRect, setExpandAlignLayoutRect] = useState<CardRect | null>(
    null,
  );
  const [expandOverlayReady, setExpandOverlayReady] = useState(false);
  const pendingExpandSyncRef = useRef<number | null>(null);
  const isHistorySyncRef = useRef(false);
  const expandOpenSessionRef = useRef<number | null>(null);
  const expandCloseReadyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [expandCloseReady, setExpandCloseReady] = useState(false);
  const [expandCloseHandoff, setExpandCloseHandoff] = useState(false);
  const expandCloseFinishedRef = useRef(false);
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

    if (expandCloseReadyTimerRef.current !== null) {
      clearTimeout(expandCloseReadyTimerRef.current);
      expandCloseReadyTimerRef.current = null;
    }

    if (expandCloseHandoffFrameRef.current !== null) {
      window.cancelAnimationFrame(expandCloseHandoffFrameRef.current);
      expandCloseHandoffFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (initialMemberSlug) {
      return;
    }

    let enterFrame = 0;
    let settleFrame = 0;
    let measureFrame = 0;
    let settleTimer: number | null = null;

    enterFrame = window.requestAnimationFrame(() => {
      settleFrame = window.requestAnimationFrame(() => {
        setEntryPhase("entering");
        settleTimer = window.setTimeout(() => {
          setEntryPhase("complete");
          measureFrame = window.requestAnimationFrame(updateZoneHitRect);
        }, CAROUSEL_ENTRY_DURATION_MS);
      });
    });

    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.cancelAnimationFrame(settleFrame);
      window.cancelAnimationFrame(measureFrame);
      if (settleTimer) {
        window.clearTimeout(settleTimer);
      }
    };
  }, [initialMemberSlug, updateZoneHitRect]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsZoneHovered(false);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [zoneSlotInBatch, batchIndex]);

  const activeIndex = Math.min(
    batchStartIndex + activeSlotInBatch,
    Math.max(items.length - 1, 0),
  );

  const activeItem = items[activeIndex];

  const carouselPerspective = useMemo(
    () => getCarouselPerspective(carouselRadius),
    [carouselRadius],
  );

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
      setExpandCloseHandoff(false);
      expandCloseFinishedRef.current = false;
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

  const pushMemberUrl = useCallback((itemIndex: number) => {
    pushPeopleMemberUrl(itemIndex, isHistorySyncRef);
  }, []);

  usePeopleCarouselRouteSync({
    initialMemberSlug,
    isHistorySyncRef,
    closeExpandedCard,
    openExpandedCardFromSlug,
  });

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
      expandCloseFinishedRef.current = false;
      return;
    }

    if (expandCloseTimerRef.current !== null) {
      return;
    }

    let transformEndCount = 0;
    let surfaceStyleSettled = false;

    const finishExpandClose = () => {
      if (expandCloseFinishedRef.current) {
        return;
      }

      expandCloseFinishedRef.current = true;

      if (expandCloseTimerRef.current !== null) {
        clearTimeout(expandCloseTimerRef.current);
        expandCloseTimerRef.current = null;
      }

      setExpandCloseHandoff(true);
    };

    const tryFinishExpandClose = () => {
      if (
        transformEndCount >= EXPAND_MORPH_TRANSFORM_END_COUNT &&
        surfaceStyleSettled
      ) {
        finishExpandClose();
      }
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      const root = expand3dRootRef.current;

      if (!root?.contains(event.target as Node)) {
        return;
      }

      if (event.propertyName === "transform") {
        transformEndCount += 1;
        tryFinishExpandClose();
        return;
      }

      if (
        event.target === expandSurfaceRef.current &&
        (event.propertyName === "border-radius" ||
          event.propertyName === "padding")
      ) {
        surfaceStyleSettled = true;
        tryFinishExpandClose();
      }
    };

    const root = expand3dRootRef.current;
    root?.addEventListener("transitionend", onTransitionEnd);

    expandCloseTimerRef.current = setTimeout(
      finishExpandClose,
      EXPAND_DURATION_MS + 120,
    );

    return () => {
      root?.removeEventListener("transitionend", onTransitionEnd);

      if (expandCloseTimerRef.current !== null) {
        clearTimeout(expandCloseTimerRef.current);
        expandCloseTimerRef.current = null;
      }
    };
  }, [expandedCard?.isClosing, expandedCard?.itemIndex]);

  useLayoutEffect(() => {
    if (!expandCloseHandoff) {
      return;
    }

    if (expandCloseHandoffFrameRef.current !== null) {
      window.cancelAnimationFrame(expandCloseHandoffFrameRef.current);
    }

    const unmountExpandOverlay = () => {
      expandOpenSessionRef.current = null;
      setExpandedCard(null);
      setLiveBodyAnchorRect(null);
      setExpandAlignLayoutRect(null);
      setExpandOverlayReady(false);

      expandCloseHandoffFrameRef.current = window.requestAnimationFrame(() => {
        expandCloseHandoffFrameRef.current = null;
        setExpandCloseHandoff(false);
      });
    };

    expandCloseHandoffFrameRef.current = window.requestAnimationFrame(() => {
      expandCloseHandoffFrameRef.current = window.requestAnimationFrame(
        unmountExpandOverlay,
      );
    });

    return () => {
      if (expandCloseHandoffFrameRef.current !== null) {
        window.cancelAnimationFrame(expandCloseHandoffFrameRef.current);
        expandCloseHandoffFrameRef.current = null;
      }
    };
  }, [expandCloseHandoff]);

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
    const shouldLockScroll = Boolean(expandedCard) || expandCloseHandoff;

    if (!shouldLockScroll) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expandCloseHandoff, expandedCard]);

  useEffect(() => {
    if (!expandedCard) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeExpandedCard();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updateExpandedTargetRect);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updateExpandedTargetRect);
    };
  }, [closeExpandedCard, expandedCard, updateExpandedTargetRect]);

  useEffect(() => {
    const isExpandedOpen = Boolean(
      expandedCard?.isOpen && !expandedCard?.isClosing,
    );

    if (!isExpandedOpen) {
      setExpandCloseReady(false);

      if (expandCloseReadyTimerRef.current !== null) {
        clearTimeout(expandCloseReadyTimerRef.current);
        expandCloseReadyTimerRef.current = null;
      }

      return;
    }

    expandCloseReadyTimerRef.current = setTimeout(() => {
      expandCloseReadyTimerRef.current = null;
      setExpandCloseReady(true);
    }, EXPAND_DURATION_MS);

    return () => {
      if (expandCloseReadyTimerRef.current !== null) {
        clearTimeout(expandCloseReadyTimerRef.current);
        expandCloseReadyTimerRef.current = null;
      }
    };
  }, [expandedCard?.isClosing, expandedCard?.isOpen]);

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

  const getScrollItemIndex = useCallback(() => {
    const track = trackRef.current;

    if (!track || items.length <= 1) {
      return zoneItemIndex;
    }

    const { trackTop, loopHeight } = getScrollMetrics(track);

    if (loopHeight <= 0) {
      return zoneItemIndex;
    }

    const progress = clamp((window.scrollY - trackTop) / loopHeight, 0, 1);
    const maxItemIndex = items.length - 1;

    return resolveStepOriginItemIndex(progress * maxItemIndex, maxItemIndex);
  }, [items.length, zoneItemIndex]);

  const applySnappedItemIndexState = useCallback(
    (itemIndex: number, trackTop: number, loopHeight: number) => {
      const maxItemIndex = items.length - 1;
      const clampedItemIndex = clamp(itemIndex, 0, maxItemIndex);
      const progress = getScrollProgressForItemIndex(
        clampedItemIndex,
        maxItemIndex,
      );
      const scrollY = trackTop + progress * loopHeight;

      window.scrollTo(0, scrollY);

      const { batchIndex: nextBatchIndex, rotation: nextRotation } =
        getSnappedCarouselStateForItemIndex(
          clampedItemIndex,
          items.length,
          VISIBLE_CAROUSEL_SLOTS,
        );

      applyCarouselState(nextBatchIndex, nextRotation);
    },
    [applyCarouselState, items.length],
  );

  const applyCarouselStateFromItemPosition = useCallback(
    (itemPosition: number, snap: boolean) => {
      const { batchIndex: nextBatchIndex, rotation: nextRotation } =
        getCarouselStateFromItemPosition(
          itemPosition,
          items.length,
          VISIBLE_CAROUSEL_SLOTS,
          snap,
        );

      applyCarouselState(nextBatchIndex, nextRotation);
    },
    [applyCarouselState, items.length],
  );

  const finishProgrammaticSnap = useCallback(() => {
    programmaticStepRef.current = false;
    programmaticTargetIndexRef.current = null;
    lastFooterHandoffWheelScrollYRef.current = null;
  }, []);

  const animateSnapToItemIndex = useCallback(
    (
      targetItemIndex: number,
      trackTop: number,
      loopHeight: number,
      options?: { useSnappedStart?: boolean },
    ) => {
      const maxItemIndex = items.length - 1;
      const clampedTargetIndex = clamp(targetItemIndex, 0, maxItemIndex);
      const targetProgress = getScrollProgressForItemIndex(
        clampedTargetIndex,
        maxItemIndex,
      );
      const targetScrollY = trackTop + targetProgress * loopHeight;

      if (Math.abs(window.scrollY - targetScrollY) <= SNAP_POSITION_TOLERANCE_PX) {
        applySnappedItemIndexState(clampedTargetIndex, trackTop, loopHeight);

        if (options?.useSnappedStart) {
          finishProgrammaticSnap();
        }

        return;
      }

      const actualStartProgress = clamp(
        (window.scrollY - trackTop) / loopHeight,
        0,
        1,
      );
      const actualStartItemPosition = actualStartProgress * maxItemIndex;

      cancelSnapAnimation();
      isSnapAnimatingRef.current = true;

      let startItemIndex = clamp(
        Math.round(actualStartItemPosition),
        0,
        maxItemIndex,
      );

      if (options?.useSnappedStart) {
        startItemIndex = resolveStepOriginItemIndex(
          actualStartItemPosition,
          maxItemIndex,
        );

        if (
          Math.abs(
            actualStartItemPosition -
              getScrollProgressForItemIndex(startItemIndex, maxItemIndex) *
                maxItemIndex,
          ) > 0.001
        ) {
          applySnappedItemIndexState(startItemIndex, trackTop, loopHeight);
        }
      }

      const animationStart = performance.now();

      const tick = (now: number) => {
        const elapsed = now - animationStart;
        const linearT = clamp(elapsed / SNAP_DURATION_MS, 0, 1);
        const easedT =
          linearT >= 1 ? 1 : Math.min(easeOutBack(linearT), 1);
        const nextItemPosition =
          startItemIndex + (clampedTargetIndex - startItemIndex) * easedT;
        const nextProgress = clamp(nextItemPosition / maxItemIndex, 0, 1);
        const nextScrollY = trackTop + nextProgress * loopHeight;

        window.scrollTo(0, nextScrollY);
        applyCarouselStateFromItemPosition(
          nextItemPosition,
          linearT >= 1,
        );

        if (linearT < 1) {
          snapAnimFrameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        applySnappedItemIndexState(clampedTargetIndex, trackTop, loopHeight);

        isSnapAnimatingRef.current = false;
        snapAnimFrameRef.current = null;

        if (options?.useSnappedStart) {
          finishProgrammaticSnap();
        }
      };

      snapAnimFrameRef.current = window.requestAnimationFrame(tick);
    },
    [
      applyCarouselStateFromItemPosition,
      applySnappedItemIndexState,
      cancelSnapAnimation,
      finishProgrammaticSnap,
      items.length,
    ],
  );

  const updateRotationFromScroll = useCallback(() => {
      if (isPeopleCarouselScrollLockedByFooter()) {
        return;
      }

      const track = trackRef.current;

      if (!track || items.length <= 1 || batchCount <= 0) {
        return;
      }

      if (isSnapAnimatingRef.current) {
        return;
      }

      if (programmaticTargetIndexRef.current !== null) {
        applyCarouselStateFromItemPosition(
          programmaticTargetIndexRef.current,
          true,
        );
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
        if (!carouselScrollIdleRef.current) {
          applyRotationFromScrollProgress(1);
          return;
        }

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
      const maxItemIndex = items.length - 1;
      const itemPositionFloat = progress * maxItemIndex;

      if (carouselScrollIdleRef.current) {
        const snappedIndex =
          resolveZoneSnapItemIndex(itemPositionFloat, maxItemIndex) ??
          Math.round(itemPositionFloat);

        applySnappedItemIndexState(snappedIndex, trackTop, loopHeight);
        return;
      }

      applyRotationFromScrollProgress(progress);
    },
    [
      applyCarouselState,
      applyCarouselStateFromItemPosition,
      applyRotationFromScrollProgress,
      applySnappedItemIndexState,
      batchCount,
      items.length,
    ],
  );

  const snapToZoneCard = useCallback(() => {
    if (isPeopleCarouselScrollLockedByFooter()) {
      return;
    }

    const track = trackRef.current;

    if (
      !track ||
      items.length <= 1 ||
      isSnapAnimatingRef.current ||
      expandedCard
    ) {
      return;
    }

    const { trackTop, loopHeight } = getScrollMetrics(track);

    if (loopHeight <= 0) {
      return;
    }

    if (isInPeopleFooterHandoffZone(window.scrollY, items.length)) {
      return;
    }

    const progress = clamp((window.scrollY - trackTop) / loopHeight, 0, 1);
    const maxItemIndex = items.length - 1;
    const itemPositionFloat = progress * maxItemIndex;
    const targetIndex = resolveZoneSnapItemIndex(
      itemPositionFloat,
      maxItemIndex,
    );

    if (targetIndex === null) {
      return;
    }

    animateSnapToItemIndex(targetIndex, trackTop, loopHeight);
  }, [animateSnapToItemIndex, expandedCard, items.length]);

  const stepCarousel = useCallback(
    (direction: -1 | 1) => {
      if (expandedCard || isSnapAnimatingRef.current) {
        return;
      }

      const currentIndex = getScrollItemIndex();
      const targetIndex = currentIndex + direction;

      if (targetIndex < 0 || targetIndex >= items.length) {
        return;
      }

      const leavingCarouselEnd =
        direction === -1 && currentIndex >= items.length - 1;

      if (isPeopleCarouselScrollLockedByFooter() && !leavingCarouselEnd) {
        return;
      }

      const track = trackRef.current;

      if (!track) {
        return;
      }

      const { trackTop, loopHeight } = getScrollMetrics(track);

      if (loopHeight <= 0) {
        return;
      }

      programmaticStepRef.current = true;
      programmaticTargetIndexRef.current = targetIndex;
      lastFooterHandoffWheelScrollYRef.current = null;

      if (direction === -1) {
        notifyPeopleCarouselProgrammaticStep(direction);
      }

      animateSnapToItemIndex(targetIndex, trackTop, loopHeight, {
        useSnappedStart: true,
      });
    },
    [animateSnapToItemIndex, expandedCard, getScrollItemIndex, items.length],
  );

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || expandedCard) {
        return;
      }

      const track = trackRef.current;

      if (!track) {
        return;
      }

      const { trackTop, loopHeight } = getScrollMetrics(track);

      if (loopHeight <= 0 || items.length <= 1) {
        return;
      }

      const carouselEndY = trackTop + loopHeight;
      const isWithinCarousel =
        window.scrollY >= trackTop - SNAP_POSITION_TOLERANCE_PX &&
        window.scrollY <= carouselEndY + SNAP_POSITION_TOLERANCE_PX;

      if (!isWithinCarousel) {
        return;
      }

      const deltaX = normalizeWheelDelta(event, event.deltaX);
      const deltaY = normalizeWheelDelta(event, event.deltaY);

      if (!isLikelyDiscreteMouseWheel(event, deltaX, deltaY)) {
        const oneCardPx = loopHeight / (items.length - 1);
        const handoffApproachY = carouselEndY - oneCardPx * 2;

        if (window.scrollY >= handoffApproachY) {
          lastFooterHandoffWheelScrollYRef.current = window.scrollY;
        }

        return;
      }

      if (wheelGestureReleaseTimerRef.current !== null) {
        clearTimeout(wheelGestureReleaseTimerRef.current);
      }

      wheelGestureReleaseTimerRef.current = setTimeout(() => {
        wheelGestureReleaseTimerRef.current = null;
        wheelGestureConsumedRef.current = false;
      }, WHEEL_GESTURE_RELEASE_MS);

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        return;
      }

      event.preventDefault();

      const direction: -1 | 1 = deltaY > 0 ? 1 : -1;
      const currentIndex = getScrollItemIndex();
      const targetIndex = currentIndex + direction;

      if (targetIndex < 0) {
        return;
      }

      if (targetIndex >= items.length) {
        lastFooterHandoffWheelScrollYRef.current = window.scrollY;
        return;
      }

      if (
        isPeopleCarouselScrollLockedByFooter() ||
        isSnapAnimatingRef.current ||
        wheelGestureConsumedRef.current
      ) {
        return;
      }

      wheelGestureConsumedRef.current = true;
      stepCarousel(direction);
    };

    const onScroll = () => {
      carouselScrollIdleRef.current = false;

      if (isSnapAnimatingRef.current) {
        return;
      }

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        updateRotationFromScroll();
      });
    };

    const onScrollEnd = () => {
      if (isPeopleCarouselScrollLockedByFooter()) {
        return;
      }

      carouselScrollIdleRef.current = true;

      if (isSnapAnimatingRef.current || programmaticStepRef.current) {
        return;
      }

      const correctedScrollY = correctPeopleFooterHandoffScroll(
        lastFooterHandoffWheelScrollYRef.current,
        window.scrollY,
        items.length,
      );

      lastFooterHandoffWheelScrollYRef.current = null;

      if (Math.abs(correctedScrollY - window.scrollY) > SNAP_POSITION_TOLERANCE_PX) {
        window.scrollTo(0, correctedScrollY);
        requestAnimationFrame(() => {
          updateRotationFromScroll();
        });
        return;
      }

      snapToZoneCard();
    };

    const initFrame = requestAnimationFrame(() => {
      updateRotationFromScroll();
    });
    const removeWheelSnapListeners =
      registerPeopleCarouselWheelSnapListeners({
        onWheel,
        onScroll,
        onScrollEnd,
      });

    return () => {
      cancelAnimationFrame(initFrame);
      removeWheelSnapListeners();

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      carouselScrollIdleRef.current = true;
      programmaticStepRef.current = false;
      programmaticTargetIndexRef.current = null;
      lastFooterHandoffWheelScrollYRef.current = null;
      wheelGestureConsumedRef.current = false;

      if (wheelGestureReleaseTimerRef.current !== null) {
        clearTimeout(wheelGestureReleaseTimerRef.current);
        wheelGestureReleaseTimerRef.current = null;
      }

      cancelSnapAnimation();
    };
  }, [
    cancelSnapAnimation,
    expandedCard,
    getScrollItemIndex,
    items.length,
    snapToZoneCard,
    stepCarousel,
    updateRotationFromScroll,
  ]);

  const visibleSlots = useMemo(() => {
    const startIndex = batchIndex * VISIBLE_CAROUSEL_SLOTS;

    return Array.from({ length: VISIBLE_CAROUSEL_SLOTS }, (_, slotIndex) => {
      const itemIndex = startIndex + slotIndex;

      if (itemIndex >= items.length) {
        return null;
      }

      // Batch 0 wraps slot 11 over the #01 zone at rest — omit only in that case.
      if (
        batchIndex === 0 &&
        zoneSlotInBatch === 0 &&
        slotIndex === VISIBLE_CAROUSEL_SLOTS - 1
      ) {
        return null;
      }

      const lastBatchIndex = Math.max(
        0,
        getBatchCount(items.length, VISIBLE_CAROUSEL_SLOTS) - 1,
      );
      const lastItemZoneSlot =
        items.length - 1 - lastBatchIndex * VISIBLE_CAROUSEL_SLOTS;

      // Last batch wraps slot 1 under the final member zone — omit only in that case.
      if (
        batchIndex === lastBatchIndex &&
        zoneSlotInBatch === lastItemZoneSlot &&
        slotIndex === 0
      ) {
        return null;
      }

      const item = items[itemIndex];

      return {
        slotIndex,
        item,
        itemIndex,
        isActive: slotIndex === activeSlotInBatch,
        isVisibleGlass: isSlotInGlassEffectWindow(
          slotIndex,
          zoneSlotInBatch,
          VISIBLE_CAROUSEL_SLOTS,
        ),
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
            className={[
              "people-carousel-entry",
              `people-carousel-entry--${entryPhase}`,
            ].join(" ")}
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
                {visibleSlots.map(({ slotIndex, item, itemIndex, isActive, isVisibleGlass, isInZone, angle }, entryIndex) => (
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
                      className={[
                        "people-carousel-card-entry",
                        isVisibleGlass
                          ? "people-carousel-card-entry--animated"
                          : "people-carousel-card-entry--deferred",
                      ].join(" ")}
                      style={
                        {
                          "--people-entry-delay": `${entryIndex * 65}ms`,
                        } as CSSProperties
                      }
                    >
                      <div
                        className={[
                          "people-carousel-card-tilt",
                          isInZone && isZoneHovered
                            ? "people-carousel-card-tilt--hovered"
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
                        <PeopleCarouselCardSurface
                          ref={isInZone ? zoneCardSurfaceRef : undefined}
                          className={[
                            "people-carousel-card__surface",
                            isVisibleGlass ? "people-carousel-card__surface--visible-glass" : "",
                            isInZone ? "people-carousel-card__surface--in-zone" : "",
                            isInZone && isZoneHovered
                              ? "people-carousel-card__surface--in-zone-hovered"
                              : "",
                            isInZone &&
                            expandedCard?.itemIndex === itemIndex &&
                            expandOverlayReady &&
                            !expandCloseHandoff
                              ? "people-carousel-card__surface--source-hidden"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          item={item}
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {zoneHitRect && !expandedCard && entryPhase === "complete" ? (
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

        {!expandedCard && items.length > 1 ? (
          <nav
            className="people-carousel-step-nav"
            aria-label="Carousel step navigation"
          >
            <button
              type="button"
              className="people-carousel-step-nav__button"
              disabled={zoneItemIndex <= 0}
              onClick={() => stepCarousel(-1)}
              aria-label="Previous member"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 10L7 5L12 10"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="people-carousel-step-nav__button"
              disabled={zoneItemIndex >= items.length - 1}
              onClick={() => stepCarousel(1)}
              aria-label="Next member"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 4L7 9L2 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </nav>
        ) : null}
      </div>

      {expandedCard && bodyAnchorRect && expandAnchor && expandRestPose ? (
        <PeopleCarouselExpandedPortal
          expandedCard={expandedCard}
          bodyAnchorRect={bodyAnchorRect}
          expandedTargetLayoutRect={expandedTargetLayoutRect}
          expandAlignRef={expandAlignRef}
          expand3dRootRef={expand3dRootRef}
          expandSurfaceRef={expandSurfaceRef}
          expandIsOpen={expandIsOpen}
          expandIsClosing={expandIsClosing}
          expandCloseHandoff={expandCloseHandoff}
          expandCloseReady={expandCloseReady}
          expandShouldAnimate={expandShouldAnimate}
          expandTransformOriginValue={expandTransformOriginValue}
          expandAlignTransform={expandAlignTransform}
          expandUseCarouselPose={expandUseCarouselPose}
          expandCarouselRigTransform={expandCarouselRigTransform}
          expandCarouselStageTransform={expandCarouselStageTransform}
          expandCarouselSlotTransform={expandCarouselSlotTransform}
          expandShowHoverSurface={expandShowHoverSurface}
          zoneHoverStandDeg={ZONE_HOVER_STAND_DEG}
          zoneHoverLiftPx={ZONE_HOVER_LIFT_PX}
          onClose={() => closeExpandedCard()}
        />
      ) : null}

      <p className="sr-only" aria-live="polite">
        {activeItem
          ? `${activeItem.name}${activeItem.role ? `, ${activeItem.role}` : ""}`
          : ""}
      </p>
    </section>
  );
}
