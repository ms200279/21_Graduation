import { clamp } from "@/app/utils/numbers";

export const DESKTOP_SLIDE_WIDTH = 1080;
export const DESKTOP_SLIDE_HEIGHT = 600;
export const DESKTOP_SLIDE_GAP = 30;
export const DESKTOP_EDGE_FADE = 100;
export const DESKTOP_RADIUS = 30;

const TOP_PADDING_MAX = 248;
const TOP_PADDING_MIN = 68;
const DOTS_OFFSET_MAX = 44;
const DOTS_OFFSET_MIN = 24;
export const DOT_SIZE = 10;
export const ACTIVE_DOT_WIDTH = 100;
const SLIDE_SHADOW_BLEED = 32;
const HORIZONTAL_SAFE = 32;
const VERTICAL_SAFE = 40;
const MOBILE_BREAKPOINT = 768;

export type CarouselLayout = {
  isMobile: boolean;
  scale: number;
  slideWidth: number;
  slideHeight: number;
  slideGap: number;
  edgeFade: number;
  radius: number;
  topPadding: number;
  dotsOffset: number;
  shadowBleed: number;
  stageWidth: number;
  stageHeight: number;
  viewWidth: number;
};

export function computeTrackOffset(
  activeIndex: number,
  slideCount: number,
  layout: Pick<CarouselLayout, "edgeFade" | "slideWidth" | "slideGap">,
) {
  const trackStep = layout.slideWidth + layout.slideGap;
  const centerOffset = layout.edgeFade;
  const target = centerOffset - activeIndex * trackStep;
  const minOffset = centerOffset - (slideCount - 1) * trackStep;

  return clamp(target, minOffset, centerOffset);
}

export function computeCarouselLayout(
  viewportWidth: number,
  viewportHeight: number,
  headerInset = 0,
): CarouselLayout {
  const isMobile = viewportWidth < MOBILE_BREAKPOINT;

  if (isMobile) {
    const sideInset = 8;
    const extraBelowHeader = Math.round(headerInset * 0.12);
    const topPadding = Math.max(6, Math.round(headerInset + extraBelowHeader));
    const dotsOffset = 14;
    const shadowBleed = 10;
    const edgeFade = 8;
    const bottomSafe = 12;
    const availableWidth = Math.max(220, viewportWidth - sideInset * 2);
    const availableHeight = Math.max(
      280,
      viewportHeight - topPadding - dotsOffset - DOT_SIZE - bottomSafe - shadowBleed * 2,
    );
    let slideWidth = availableWidth - edgeFade * 2;
    let slideHeight = slideWidth * 1.5;

    if (slideHeight > availableHeight) {
      slideHeight = availableHeight;
      slideWidth = slideHeight * (2 / 3);
    }

    const viewWidth = slideWidth + edgeFade * 2;
    const stackHeight = topPadding + slideHeight + dotsOffset + DOT_SIZE;
    const stageWidth = viewWidth + shadowBleed * 2;
    const stageHeight = stackHeight + shadowBleed * 2;

    return {
      isMobile: true,
      scale: 1,
      slideWidth,
      slideHeight,
      slideGap: 16,
      edgeFade,
      radius: 18,
      topPadding,
      dotsOffset,
      shadowBleed,
      stageWidth,
      stageHeight,
      viewWidth,
    };
  }

  const topPadding = Math.min(
    TOP_PADDING_MAX,
    Math.max(TOP_PADDING_MIN, viewportHeight * 0.14),
  );
  const dotsOffset = Math.min(
    DOTS_OFFSET_MAX,
    Math.max(DOTS_OFFSET_MIN, viewportHeight * 0.034),
  );
  const viewWidth = DESKTOP_SLIDE_WIDTH + DESKTOP_EDGE_FADE * 2;
  const stackHeight = topPadding + DESKTOP_SLIDE_HEIGHT + dotsOffset + DOT_SIZE;
  const stageHeight = stackHeight + SLIDE_SHADOW_BLEED * 2;
  const scaleX = (viewportWidth - HORIZONTAL_SAFE * 2) / viewWidth;
  const scaleY = (viewportHeight - VERTICAL_SAFE * 2) / stageHeight;
  const scale = Math.min(1, scaleX, scaleY);

  return {
    isMobile: false,
    scale,
    slideWidth: DESKTOP_SLIDE_WIDTH,
    slideHeight: DESKTOP_SLIDE_HEIGHT,
    slideGap: DESKTOP_SLIDE_GAP,
    edgeFade: DESKTOP_EDGE_FADE,
    radius: DESKTOP_RADIUS,
    topPadding,
    dotsOffset,
    shadowBleed: SLIDE_SHADOW_BLEED,
    stageWidth: (viewWidth + SLIDE_SHADOW_BLEED * 2) * scale,
    stageHeight: stageHeight * scale,
    viewWidth,
  };
}
