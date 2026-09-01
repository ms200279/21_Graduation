"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import "@/app/styles/projects-cylinder-gallery.css";
import {
  BUTTON_INTERACTION_RELEASE_MS,
  easeOutCubic,
  getBackCycle,
  getCenteredAngleDistance,
  getCylinderRadius,
  getNearestCardCenteredRotation,
  getSnappedRotation,
  HOVER_MISS_LIMIT,
  HOVER_SNAP_INTERVAL_MS,
  isCardVisible,
  ROTATION_SPEED_DEG,
  SNAP_ANIMATION_MS,
  type ProjectCard,
  WHEEL_ROTATION_SCALE,
  WHEEL_SNAP_DELAY_MS,
} from "./projectsCylinderConfig";

export type CylinderRowProps = {
  cards: ProjectCard[];
  direction: 1 | -1;
  label: string;
  isPaused?: boolean;
  onCardRecycle: (index: number) => void;
  onCardSelect: (id: number) => void;
  getProjectName: (id: number) => string;
};

export default function CylinderRow({
  cards,
  direction,
  label,
  isPaused = false,
  onCardRecycle,
  onCardSelect,
  getProjectName,
}: CylinderRowProps) {
  const rowRef = useRef<HTMLElement>(null);
  const rotationRef = useRef(0);
  const slotBackCyclesRef = useRef<number[]>(
    cards.map((_, index) => getBackCycle((360 / cards.length) * index)),
  );
  const pendingRecycleIndexesRef = useRef<Set<number>>(new Set());
  const frameRef = useRef<number | null>(null);
  const snapFrameRef = useRef<number | null>(null);
  const hoverSnapTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wheelSnapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveredRef = useRef(false);
  const isWheelInteractingRef = useRef(false);
  const hoverMissCountRef = useRef(0);
  const hoveredCardIndexRef = useRef<number | null>(null);
  const snapTargetRotationRef = useRef<number | null>(null);
  const pointerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const cardAngleRef = useRef(0);
  const commitRotationRef = useRef<
    (nextRotation: number, recycleCards?: boolean) => void
  >(() => {});
  const directionRef = useRef(direction);
  const isPausedRef = useRef(isPaused);
  const [rotation, setRotation] = useState(0);
  const cardCount = cards.length;
  const cardAngle = 360 / cardCount;

  const flushPendingRecycleIndexes = useCallback((limit = 1) => {
    let recycledCount = 0;

    for (const index of pendingRecycleIndexesRef.current) {
      const cardAngleValue = cardAngle * index;
      const distanceFromFront = getCenteredAngleDistance(
        cardAngleValue + rotationRef.current,
      );

      if (isCardVisible(distanceFromFront, cardAngle)) {
        continue;
      }

      pendingRecycleIndexesRef.current.delete(index);
      onCardRecycle(index);
      recycledCount += 1;

      if (recycledCount >= limit) {
        break;
      }
    }
  }, [cardAngle, onCardRecycle]);

  const commitRotation = useCallback((nextRotation: number, recycleCards = true) => {
    rotationRef.current = nextRotation;
    setRotation(nextRotation);

    for (let index = 0; index < cardCount; index += 1) {
      const cardAngleValue = cardAngle * index;
      const nextBackCycle = getBackCycle(cardAngleValue + nextRotation);

      if (slotBackCyclesRef.current[index] !== nextBackCycle) {
        slotBackCyclesRef.current[index] = nextBackCycle;
        pendingRecycleIndexesRef.current.add(index);
      }
    }

    if (recycleCards) {
      flushPendingRecycleIndexes();
    }
  }, [cardAngle, cardCount, flushPendingRecycleIndexes]);

  useEffect(() => {
    cardAngleRef.current = cardAngle;
    commitRotationRef.current = commitRotation;
    directionRef.current = direction;
    isPausedRef.current = isPaused;
  }, [cardAngle, commitRotation, direction, isPaused]);

  useEffect(() => {
    if (!isPaused) {
      return;
    }

    isHoveredRef.current = false;
    hoveredCardIndexRef.current = null;
    hoverMissCountRef.current = 0;
    pointerPositionRef.current = null;
    isWheelInteractingRef.current = false;

    if (hoverSnapTimerRef.current !== null) {
      clearInterval(hoverSnapTimerRef.current);
      hoverSnapTimerRef.current = null;
    }

    if (wheelSnapTimerRef.current !== null) {
      clearTimeout(wheelSnapTimerRef.current);
      wheelSnapTimerRef.current = null;
    }

    if (snapFrameRef.current !== null) {
      window.cancelAnimationFrame(snapFrameRef.current);
      snapFrameRef.current = null;
    }

    snapTargetRotationRef.current = null;
  }, [isPaused]);

  const cancelSnapAnimation = () => {
    if (snapFrameRef.current !== null) {
      window.cancelAnimationFrame(snapFrameRef.current);
      snapFrameRef.current = null;
    }

    snapTargetRotationRef.current = null;
  };

  const animateSnapToRotation = (targetRotation: number) => {
    if (
      snapFrameRef.current !== null &&
      snapTargetRotationRef.current !== null &&
      Math.abs(snapTargetRotationRef.current - targetRotation) < 0.01
    ) {
      return;
    }

    cancelSnapAnimation();
    snapTargetRotationRef.current = targetRotation;

    const startRotation = rotationRef.current;
    const delta = targetRotation - startRotation;

    if (Math.abs(delta) < 0.01) {
      commitRotation(targetRotation, false);
      snapTargetRotationRef.current = null;
      return;
    }

    const animate = (startTime: number) => {
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / SNAP_ANIMATION_MS, 1);
        const nextRotation = startRotation + delta * easeOutCubic(progress);

        commitRotation(nextRotation, false);

        if (progress < 1) {
          snapFrameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        commitRotation(targetRotation, false);
        snapFrameRef.current = null;
        snapTargetRotationRef.current = null;
        flushPendingRecycleIndexes();
      };

      tick(startTime);
    };

    snapFrameRef.current = window.requestAnimationFrame(animate);
  };

  const animateSnapToNearest = () => {
    animateSnapToRotation(getSnappedRotation(rotationRef.current, cardAngle));
  };

  const animateSnapToHoveredCard = () => {
    if (hoveredCardIndexRef.current === null) {
      animateSnapToNearest();
      return;
    }

    animateSnapToRotation(
      getNearestCardCenteredRotation(
        hoveredCardIndexRef.current,
        cardAngle,
        rotationRef.current,
      ),
    );
  };

  const stepCarousel = (step: -1 | 1) => {
    isWheelInteractingRef.current = true;

    if (wheelSnapTimerRef.current !== null) {
      clearTimeout(wheelSnapTimerRef.current);
      wheelSnapTimerRef.current = null;
    }

    const snappedRotation = getSnappedRotation(rotationRef.current, cardAngle);

    animateSnapToRotation(snappedRotation + step * cardAngle);

    wheelSnapTimerRef.current = setTimeout(() => {
      isWheelInteractingRef.current = false;
      wheelSnapTimerRef.current = null;
    }, BUTTON_INTERACTION_RELEASE_MS);
  };

  const stopHoverSnapTimer = () => {
    if (hoverSnapTimerRef.current !== null) {
      clearInterval(hoverSnapTimerRef.current);
      hoverSnapTimerRef.current = null;
    }

    hoverMissCountRef.current = 0;
  };

  const stopHoverTracking = () => {
    isHoveredRef.current = false;
    hoveredCardIndexRef.current = null;
    pointerPositionRef.current = null;
    stopHoverSnapTimer();
    cancelSnapAnimation();
  };

  const getHoveredCardIndexFromPointer = (
    pointerPosition: { x: number; y: number },
  ) => {
    const row = rowRef.current;

    if (!row) {
      return null;
    }

    const visibleCards = Array.from(
      row.querySelectorAll<HTMLElement>(".projects-cylinder-card--visible"),
    );
    const hoveredCard = visibleCards.find((card) => {
      const rect = card.getBoundingClientRect();

      return (
        pointerPosition.x >= rect.left &&
        pointerPosition.x <= rect.right &&
        pointerPosition.y >= rect.top &&
        pointerPosition.y <= rect.bottom
      );
    });

    if (!hoveredCard) {
      return null;
    }

    return Number(hoveredCard.dataset.projectCardIndex);
  };

  const startHoverSnapTimer = () => {
    if (hoverSnapTimerRef.current !== null) {
      return;
    }

    hoverSnapTimerRef.current = setInterval(() => {
      const pointerPosition = pointerPositionRef.current;

      if (!pointerPosition) {
        stopHoverTracking();
        return;
      }

      if (pointerPosition) {
        const hoveredCardIndex = getHoveredCardIndexFromPointer(pointerPosition);

        if (hoveredCardIndex !== null) {
          hoveredCardIndexRef.current = hoveredCardIndex;
          isHoveredRef.current = true;
          hoverMissCountRef.current = 0;
        } else {
          hoverMissCountRef.current += 1;
          isHoveredRef.current = false;
          hoveredCardIndexRef.current = null;

          if (hoverMissCountRef.current >= HOVER_MISS_LIMIT) {
            stopHoverTracking();
            return;
          }
        }
      }

      if (isHoveredRef.current) {
        animateSnapToHoveredCard();
      }
    }, HOVER_SNAP_INTERVAL_MS);
  };

  useEffect(() => {
    const tick = () => {
      if (
        !isPausedRef.current &&
        !isHoveredRef.current &&
        !isWheelInteractingRef.current
      ) {
        commitRotation(rotationRef.current + ROTATION_SPEED_DEG * direction);
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      cancelSnapAnimation();
      stopHoverSnapTimer();

      if (wheelSnapTimerRef.current !== null) {
        clearTimeout(wheelSnapTimerRef.current);
      }

      isWheelInteractingRef.current = false;
    };
  }, [commitRotation, direction, flushPendingRecycleIndexes]);

  useEffect(() => {
    const isPointerInRowWheelZone = (event: WheelEvent) => {
      const row = rowRef.current;

      if (!row) {
        return false;
      }

      const rowRect = row.getBoundingClientRect();
      const isInRowRect =
        event.clientX >= rowRect.left &&
        event.clientX <= rowRect.right &&
        event.clientY >= rowRect.top &&
        event.clientY <= rowRect.bottom;

      if (isInRowRect) {
        return true;
      }

      const visibleCards = Array.from(
        row.querySelectorAll<HTMLElement>(".projects-cylinder-card--visible"),
      );

      return visibleCards.some((card) => {
        const rect = card.getBoundingClientRect();

        return (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        );
      });
    };

    const handleWheel = (event: WheelEvent) => {
      const isProjectDetailOpen =
        document.documentElement.hasAttribute("data-project-detail-open") ||
        (event.target instanceof Element &&
          event.target.closest(".project-detail-layer") !== null);

      if (isProjectDetailOpen) {
        return;
      }

      if (!isPointerInRowWheelZone(event)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      isWheelInteractingRef.current = true;

      if (snapFrameRef.current !== null) {
        window.cancelAnimationFrame(snapFrameRef.current);
        snapFrameRef.current = null;
      }

      snapTargetRotationRef.current = null;

      const nextRotation =
        rotationRef.current +
        Math.sign(event.deltaY || event.deltaX) *
          cardAngleRef.current *
          WHEEL_ROTATION_SCALE *
          directionRef.current;

      commitRotationRef.current(nextRotation);

      if (wheelSnapTimerRef.current !== null) {
        clearTimeout(wheelSnapTimerRef.current);
      }

      wheelSnapTimerRef.current = setTimeout(() => {
        const targetRotation = getSnappedRotation(
          rotationRef.current,
          cardAngleRef.current,
        );
        const startRotation = rotationRef.current;
        const delta = targetRotation - startRotation;

        if (Math.abs(delta) < 0.01) {
          commitRotationRef.current(targetRotation, false);
          wheelSnapTimerRef.current = null;
          isWheelInteractingRef.current = false;
          return;
        }

        snapTargetRotationRef.current = targetRotation;

        const animate = (startTime: number) => {
          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / SNAP_ANIMATION_MS, 1);
            const nextRotation = startRotation + delta * easeOutCubic(progress);

            commitRotationRef.current(nextRotation, false);

            if (progress < 1) {
              snapFrameRef.current = window.requestAnimationFrame(tick);
              return;
            }

            commitRotationRef.current(targetRotation, false);
            snapFrameRef.current = null;
            snapTargetRotationRef.current = null;
            flushPendingRecycleIndexes();
            isWheelInteractingRef.current = false;
          };

          tick(startTime);
        };

        snapFrameRef.current = window.requestAnimationFrame(animate);
        wheelSnapTimerRef.current = null;
      }, WHEEL_SNAP_DELAY_MS);
    };

    window.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, [flushPendingRecycleIndexes]);

  return (
    <section
      ref={rowRef}
      className="projects-cylinder-row"
      aria-label={label}
      onPointerMove={(event) => {
        pointerPositionRef.current = {
          x: event.clientX,
          y: event.clientY,
        };
        startHoverSnapTimer();
      }}
      onPointerLeave={() => {
        stopHoverTracking();
      }}
    >
      <button
        type="button"
        className="projects-cylinder-row__button projects-cylinder-row__button--previous"
        aria-label={`${label} previous card`}
        onClick={() => {
          stepCarousel(-1);
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 2L4 7L9 12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        className="projects-cylinder-row__button projects-cylinder-row__button--next"
        aria-label={`${label} next card`}
        onClick={() => {
          stepCarousel(1);
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 2L10 7L5 12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="projects-cylinder-row__viewport">
        <div
          className="projects-cylinder-row__track"
          style={{
            "--projects-cylinder-radius": getCylinderRadius(),
            transform: `translateX(-50%) rotateY(${rotation}deg)`,
          } as CSSProperties}
        >
          {cards.map((card, index) => {
            const cardAngleValue = cardAngle * index;
            const distanceFromFront = getCenteredAngleDistance(
              cardAngleValue + rotation,
            );
            const isVisible = isCardVisible(distanceFromFront, cardAngle);

            return (
              <button
                type="button"
                key={`${index}-${card.id}`}
                className={[
                  "projects-cylinder-card",
                  isVisible ? "projects-cylinder-card--visible" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  "--project-card-index": index,
                  "--project-card-angle": `${cardAngleValue}deg`,
                } as CSSProperties}
                data-project-card-index={index}
                aria-hidden={!isVisible}
                aria-label={`Open ${getProjectName(card.id)}`}
                tabIndex={isVisible ? 0 : -1}
                onClick={() => onCardSelect(card.id)}
                onPointerEnter={(event) => {
                  pointerPositionRef.current = {
                    x: event.clientX,
                    y: event.clientY,
                  };
                  isHoveredRef.current = true;
                  hoverMissCountRef.current = 0;
                  hoveredCardIndexRef.current = index;
                  startHoverSnapTimer();
                }}
              >
                <div className="projects-cylinder-card__visual">
                  <span className="projects-cylinder-card__number">
                    {String(card.id).padStart(2, "0")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
