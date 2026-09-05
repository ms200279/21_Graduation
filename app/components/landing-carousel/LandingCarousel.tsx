"use client";

import {
  CSSProperties,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { clamp } from "@/app/utils/numbers";
import {
  CONCEPT_CAROUSEL_SLIDES,
  type LandingCarouselSlide,
} from "./slides";
import ConceptCarouselSlideContent from "./ConceptCarouselSlideContent";

/** Design-max tokens (large viewport baseline). */
const SLIDE_WIDTH = 1080;
const SLIDE_HEIGHT = 600;
const SLIDE_GAP = 30;
const TOP_PADDING_MAX = 248;
const TOP_PADDING_MIN = 68;
const DOTS_OFFSET_MAX = 44;
const DOTS_OFFSET_MIN = 24;
const DOTS_GAP = 25;
const DOT_SIZE = 10;
const ACTIVE_DOT_WIDTH = 100;

const TRACK_STEP = SLIDE_WIDTH + SLIDE_GAP;
/** Horizontal edge fade + blur width (design px). */
const SLIDE_EDGE_FADE = 100;
/** Corner radius at design-max (scale = 1); scales visually with stage transform. */
const SLIDE_RADIUS_MAX = 30;
/** Room for drop shadow inside the viewport clip (>= blur radius). */
const SLIDE_SHADOW_BLEED = 32;
const HORIZONTAL_SAFE = 32;
const VERTICAL_SAFE = 40;
const NAV_BUTTON_SIZE = 44;
const NAV_BUTTON_GAP = 80;

const CAROUSEL_VIEW_WIDTH = SLIDE_WIDTH + SLIDE_EDGE_FADE * 2;

function computeTrackOffset(activeIndex: number, slideCount: number) {
  const centerOffset = SLIDE_EDGE_FADE;
  const target = centerOffset - activeIndex * TRACK_STEP;
  const minOffset = centerOffset - (slideCount - 1) * TRACK_STEP;

  return clamp(target, minOffset, centerOffset);
}

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

type CarouselLayout = {
  scale: number;
  topPadding: number;
  dotsOffset: number;
  stackHeight: number;
  stageHeight: number;
};

function computeCarouselLayout(
  viewportWidth: number,
  viewportHeight: number,
): CarouselLayout {
  const topPadding = Math.min(
    TOP_PADDING_MAX,
    Math.max(TOP_PADDING_MIN, viewportHeight * 0.14),
  );
  const dotsOffset = Math.min(
    DOTS_OFFSET_MAX,
    Math.max(DOTS_OFFSET_MIN, viewportHeight * 0.034),
  );
  const stackHeight = topPadding + SLIDE_HEIGHT + dotsOffset + DOT_SIZE;
  const stageHeight = stackHeight + SLIDE_SHADOW_BLEED * 2;

  const scaleX =
    (viewportWidth - HORIZONTAL_SAFE * 2) / CAROUSEL_VIEW_WIDTH;
  const scaleY = (viewportHeight - VERTICAL_SAFE * 2) / stageHeight;

  return {
    scale: Math.min(1, scaleX, scaleY),
    topPadding,
    dotsOffset,
    stackHeight,
    stageHeight,
  };
}

type CarouselSlideProps = {
  slide: LandingCarouselSlide;
  index: number;
  slideCount: number;
  isActive: boolean;
};

const CarouselSlide = memo(function CarouselSlide({
  slide,
  index,
  slideCount,
  isActive,
}: CarouselSlideProps) {
  const slideStyle: CSSProperties = {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    flexShrink: 0,
    marginRight: index < slideCount - 1 ? SLIDE_GAP : 0,
    borderRadius: SLIDE_RADIUS_MAX,
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
        style={{ borderRadius: SLIDE_RADIUS_MAX }}
      />
      <div
        className="landing-carousel__slide-surface relative z-[1]"
        style={{ borderRadius: SLIDE_RADIUS_MAX }}
      >
        <ConceptCarouselSlideContent slide={slide} isActive={isActive} />
      </div>
    </article>
  );
});

const DEFAULT_VIEWPORT = { width: 1440, height: 900 };
const DEFAULT_LAYOUT = computeCarouselLayout(
  DEFAULT_VIEWPORT.width,
  DEFAULT_VIEWPORT.height,
);

let cachedLayoutSnapshot = DEFAULT_LAYOUT;
let cachedLayoutViewportWidth = DEFAULT_VIEWPORT.width;
let cachedLayoutViewportHeight = DEFAULT_VIEWPORT.height;

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

  return () => {
    window.removeEventListener("resize", handleResize);

    if (resizeRaf) {
      cancelAnimationFrame(resizeRaf);
    }
  };
}

function getCarouselLayoutSnapshot() {
  const width = window.innerWidth;
  const height = window.innerHeight;

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = slides.length;
  const layout = useSyncExternalStore(
    subscribeToCarouselLayout,
    getCarouselLayoutSnapshot,
    getCarouselLayoutServerSnapshot,
  );
  const offsetX = useMemo(
    () => computeTrackOffset(activeIndex, slideCount),
    [activeIndex, slideCount],
  );

  const goToPrev = useCallback(() => {
    setActiveIndex((index) => Math.max(0, index - 1));
  }, []);

  const goToNext = useCallback(() => {
    setActiveIndex((index) => Math.min(slideCount - 1, index + 1));
  }, [slideCount]);

  const { scale, topPadding, dotsOffset, stageHeight } = layout;
  const scaledCarouselWidth = CAROUSEL_VIEW_WIDTH * scale;
  const scaledStageWidth = (CAROUSEL_VIEW_WIDTH + SLIDE_SHADOW_BLEED * 2) * scale;
  const scaledStageHeight = stageHeight * scale;
  const slideCenterY =
    (topPadding + SLIDE_SHADOW_BLEED + SLIDE_HEIGHT / 2) * scale;
  const navInset = `max(16px, calc(50% - ${scaledCarouselWidth / 2}px - ${NAV_BUTTON_SIZE + NAV_BUTTON_GAP}px))`;

  const stageStyle: CSSProperties = {
    width: CAROUSEL_VIEW_WIDTH + SLIDE_SHADOW_BLEED * 2,
    height: stageHeight,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  const trackStyle: CSSProperties = {
    transform: `translate3d(${offsetX}px, 0, 0)`,
    transition: "transform 520ms cubic-bezier(0.34, 1.08, 0.54, 1)",
  };

  return (
    <div
      className={`landing-carousel relative z-10 w-full overflow-visible pointer-events-auto ${className}`.trim()}
      style={{ height: scaledStageHeight }}
    >
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

      <div
        className="landing-carousel__scale-shell mx-auto overflow-visible"
        style={{ width: scaledStageWidth, height: scaledStageHeight }}
      >
        <div className="landing-carousel__stage" style={stageStyle}>
          <div style={{ paddingTop: topPadding }}>
            <div
              ref={viewportRef}
              className="landing-carousel__viewport relative mx-auto overflow-hidden"
              style={{
                width: CAROUSEL_VIEW_WIDTH + SLIDE_SHADOW_BLEED * 2,
                height: SLIDE_HEIGHT + SLIDE_SHADOW_BLEED * 2,
              }}
            >
              <div
                className="landing-carousel__track absolute flex will-change-transform"
                style={{
                  ...trackStyle,
                  top: SLIDE_SHADOW_BLEED,
                  left: SLIDE_SHADOW_BLEED,
                  height: SLIDE_HEIGHT,
                }}
              >
                {slides.map((slide, index) => (
                  <CarouselSlide
                    key={slide.id}
                    slide={slide}
                    index={index}
                    slideCount={slideCount}
                    isActive={index === activeIndex}
                  />
                ))}
              </div>
            </div>

            <div
              className="landing-carousel__dots flex items-center justify-center"
              style={{ gap: DOTS_GAP, marginTop: dotsOffset }}
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
                    onClick={() => setActiveIndex(index)}
                    className={[
                      "landing-carousel__dot rounded-full bg-systemNavy/35 transition-all duration-500 ease-out",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-systemNavy",
                      isActive ? "opacity-100" : "opacity-70 hover:opacity-90",
                    ].join(" ")}
                    style={{
                      width: isActive ? ACTIVE_DOT_WIDTH : DOT_SIZE,
                      height: DOT_SIZE,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
