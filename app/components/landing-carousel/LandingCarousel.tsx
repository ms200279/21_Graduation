"use client";

import {
  CSSProperties,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  CONCEPT_CAROUSEL_SLIDES,
  type LandingCarouselSlide,
} from "./slides";
import ConceptCarouselSlideContent from "./ConceptCarouselSlideContent";
import {
  ACTIVE_DOT_WIDTH,
  DOT_SIZE,
  computeCarouselLayout,
  computeTrackOffset,
  type CarouselLayout,
} from "./landingCarouselLayout";
import { MOBILE_VIEWPORT_EVENT } from "../mobile-shell/viewportMetrics";

const SWIPE_DISTANCE = 48;
const SWIPE_DOMINANCE = 1.15;
const NAV_BUTTON_SIZE = 44;
const NAV_BUTTON_GAP = 80;
const DEFAULT_VIEWPORT = { width: 1440, height: 900 };
const DEFAULT_LAYOUT = computeCarouselLayout(
  DEFAULT_VIEWPORT.width,
  DEFAULT_VIEWPORT.height,
);

type CarouselNavButtonProps = {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
};

const CarouselNavButton = memo(function CarouselNavButton({
  direction,
  disabled,
  onClick,
}: CarouselNavButtonProps) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
      disabled={disabled}
      onClick={onClick}
      className={[
        "landing-carousel__nav-button landing-carousel__blur-surface flex items-center justify-center rounded-full text-systemNavy transition-[opacity,box-shadow] duration-300",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-systemNavy",
        disabled
          ? "cursor-not-allowed opacity-25"
          : "cursor-pointer opacity-90 hover:opacity-100",
      ].join(" ")}
      style={{ width: NAV_BUTTON_SIZE, height: NAV_BUTTON_SIZE }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        {direction === "prev" ? (
          <path
            d="M9 2L4 7L9 12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M5 2L10 7L5 12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
});

type CarouselSlideProps = {
  slide: LandingCarouselSlide;
  index: number;
  slideCount: number;
  isActive: boolean;
  width: number;
  height: number;
  gap: number;
  radius: number;
};

const CarouselSlide = memo(function CarouselSlide({
  slide,
  index,
  slideCount,
  isActive,
  width,
  height,
  gap,
  radius,
}: CarouselSlideProps) {
  const slideStyle: CSSProperties = {
    width,
    height,
    flexShrink: 0,
    marginRight: index < slideCount - 1 ? gap : 0,
    borderRadius: radius,
  };

  return (
    <article
      className={[
        "landing-carousel__slide relative shrink-0",
        isActive ? "landing-carousel__slide--active" : "",
      ].join(" ")}
      style={slideStyle}
      aria-hidden={!isActive}
      aria-label={slide.title}
    >
      <div
        className="landing-carousel__slide-shadow"
        aria-hidden="true"
        style={{ borderRadius: radius }}
      />
      <div
        className="landing-carousel__slide-surface relative z-[1]"
        style={{ borderRadius: radius }}
      >
        <ConceptCarouselSlideContent slide={slide} isActive={isActive} />
      </div>
    </article>
  );
});

let cachedLayoutSnapshot = DEFAULT_LAYOUT;
let cachedLayoutViewportWidth = DEFAULT_VIEWPORT.width;
let cachedLayoutViewportHeight = DEFAULT_VIEWPORT.height;

function readViewportSize() {
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function subscribeToCarouselLayout(onStoreChange: () => void) {
  let resizeRaf = 0;

  const handleResize = () => {
    if (resizeRaf) {
      return;
    }

    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      onStoreChange();
    });
  };

  window.addEventListener("resize", handleResize);
  window.addEventListener(MOBILE_VIEWPORT_EVENT, handleResize);
  window.visualViewport?.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
    window.removeEventListener(MOBILE_VIEWPORT_EVENT, handleResize);
    window.visualViewport?.removeEventListener("resize", handleResize);

    if (resizeRaf) {
      cancelAnimationFrame(resizeRaf);
    }
  };
}

function getCarouselLayoutSnapshot() {
  const { width, height } = readViewportSize();

  if (
    width === cachedLayoutViewportWidth &&
    height === cachedLayoutViewportHeight
  ) {
    return cachedLayoutSnapshot;
  }

  cachedLayoutViewportWidth = width;
  cachedLayoutViewportHeight = height;
  cachedLayoutSnapshot = computeCarouselLayout(width, height);

  return cachedLayoutSnapshot;
}

function getCarouselLayoutServerSnapshot() {
  return DEFAULT_LAYOUT;
}

type LandingCarouselProps = {
  slides?: LandingCarouselSlide[];
  className?: string;
};

export default function LandingCarousel({
  slides = CONCEPT_CAROUSEL_SLIDES,
  className = "",
}: LandingCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = slides.length;
  const layout = useSyncExternalStore(
    subscribeToCarouselLayout,
    getCarouselLayoutSnapshot,
    getCarouselLayoutServerSnapshot,
  ) as CarouselLayout;
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeConsumedRef = useRef(false);
  const offsetX = useMemo(
    () => computeTrackOffset(activeIndex, slideCount, layout),
    [activeIndex, layout, slideCount],
  );

  const goToIndex = useCallback(
    (index: number) => {
      setActiveIndex(clampIndex(index, slideCount));
    },
    [slideCount],
  );

  const goToPrev = useCallback(() => {
    setActiveIndex((index) => Math.max(0, index - 1));
  }, []);

  const goToNext = useCallback(() => {
    setActiveIndex((index) => Math.min(slideCount - 1, index + 1));
  }, [slideCount]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    swipeConsumedRef.current = false;
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const start = pointerStartRef.current;

      if (!start || swipeConsumedRef.current) {
        return;
      }

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;

      if (
        Math.abs(deltaX) < SWIPE_DISTANCE ||
        Math.abs(deltaX) < Math.abs(deltaY) * SWIPE_DOMINANCE
      ) {
        return;
      }

      swipeConsumedRef.current = true;

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic or already-released pointers can throw; paging still applies.
      }

      event.preventDefault();
      goToIndex(activeIndex + (deltaX < 0 ? 1 : -1));
    },
    [activeIndex, goToIndex],
  );

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = null;
    swipeConsumedRef.current = false;

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore capture release errors from synthetic pointers.
      }
    }
  }, []);

  const {
    scale,
    slideWidth,
    slideHeight,
    slideGap,
    radius,
    topPadding,
    dotsOffset,
    shadowBleed,
    stageWidth,
    stageHeight,
    viewWidth,
  } = layout;

  const unscaledStageWidth = viewWidth + shadowBleed * 2;
  const unscaledStageHeight =
    topPadding + slideHeight + dotsOffset + DOT_SIZE + shadowBleed * 2;

  const stageStyle: CSSProperties = {
    width: unscaledStageWidth,
    height: unscaledStageHeight,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  const trackStyle: CSSProperties = {
    transform: `translate3d(${offsetX}px, 0, 0)`,
    transition: "transform 520ms cubic-bezier(0.34, 1.08, 0.54, 1)",
  };

  const scaledCarouselWidth = viewWidth * scale;
  const slideCenterY =
    (topPadding + shadowBleed + slideHeight / 2) * scale;
  const navInset = `max(16px, calc(50% - ${scaledCarouselWidth / 2}px - ${NAV_BUTTON_SIZE + NAV_BUTTON_GAP}px))`;
  const swipeHandlers = layout.isMobile
    ? {
        onPointerDownCapture: handlePointerDown,
        onPointerMoveCapture: handlePointerMove,
        onPointerUpCapture: handlePointerUp,
        onPointerCancelCapture: handlePointerUp,
      }
    : {};

  return (
    <div
      className={`landing-carousel relative z-10 w-full overflow-visible pointer-events-auto ${className}`.trim()}
      style={{ height: stageHeight }}
    >
      {layout.isMobile ? null : (
        <div
          className="landing-carousel__nav landing-carousel__nav--prev absolute -translate-y-1/2"
          style={{ top: slideCenterY, left: navInset }}
        >
          <CarouselNavButton
            direction="prev"
            disabled={activeIndex === 0}
            onClick={goToPrev}
          />
        </div>
      )}

      <div
        className="landing-carousel__scale-shell mx-auto overflow-visible"
        style={{ width: stageWidth, height: stageHeight }}
      >
        <div className="landing-carousel__stage" style={stageStyle}>
          <div style={{ paddingTop: topPadding }}>
            <div
              className="landing-carousel__viewport relative mx-auto overflow-hidden"
              style={{
                width: viewWidth + shadowBleed * 2,
                height: slideHeight + shadowBleed * 2,
                ...(layout.isMobile ? { touchAction: "pan-y" } : {}),
              }}
              {...swipeHandlers}
            >
              <div
                className="landing-carousel__track absolute flex will-change-transform"
                style={{
                  ...trackStyle,
                  top: shadowBleed,
                  left: shadowBleed,
                  height: slideHeight,
                }}
              >
                {slides.map((slide, index) => (
                  <CarouselSlide
                    key={slide.id}
                    slide={slide}
                    index={index}
                    slideCount={slideCount}
                    isActive={index === activeIndex}
                    width={slideWidth}
                    height={slideHeight}
                    gap={slideGap}
                    radius={radius}
                  />
                ))}
              </div>
            </div>

            <div
              className="landing-carousel__dots flex items-center justify-center"
              style={{ gap: layout.isMobile ? 14 : 25, marginTop: dotsOffset }}
              role="tablist"
              aria-label="Carousel pagination"
            >
              {slides.map((slide, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Go to ${slide.title} slide`}
                    onClick={() => goToIndex(index)}
                    className={[
                      "landing-carousel__dot rounded-full bg-systemNavy/35 transition-all duration-500 ease-out",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-systemNavy",
                      isActive ? "opacity-100" : "opacity-70 hover:opacity-90",
                    ].join(" ")}
                    style={{
                      width: isActive
                        ? layout.isMobile
                          ? 42
                          : ACTIVE_DOT_WIDTH
                        : DOT_SIZE,
                      height: DOT_SIZE,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {layout.isMobile ? null : (
        <div
          className="landing-carousel__nav landing-carousel__nav--next absolute -translate-y-1/2"
          style={{ top: slideCenterY, right: navInset }}
        >
          <CarouselNavButton
            direction="next"
            disabled={activeIndex === slideCount - 1}
            onClick={goToNext}
          />
        </div>
      )}
    </div>
  );
}

function clampIndex(index: number, slideCount: number) {
  if (index < 0) {
    return 0;
  }

  if (index > slideCount - 1) {
    return slideCount - 1;
  }

  return index;
}
