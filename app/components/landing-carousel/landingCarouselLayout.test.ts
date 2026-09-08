import { describe, expect, it } from "vitest";

import {
  computeCarouselLayout,
  computeTrackOffset,
} from "./landingCarouselLayout";

describe("computeCarouselLayout", () => {
  it("uses a portrait card that fits a phone snap screen", () => {
    const layout = computeCarouselLayout(390, 844);

    expect(layout.isMobile).toBe(true);
    expect(layout.scale).toBe(1);
    expect(layout.slideHeight / layout.slideWidth).toBeGreaterThanOrEqual(1.5);
    expect(layout.slideHeight / layout.slideWidth).toBeLessThanOrEqual(1.68);
    expect(layout.slideWidth).toBeLessThan(390);
    expect(layout.stageHeight).toBeLessThanOrEqual(844);
  });

  it("keeps the landscape design canvas on desktop", () => {
    const layout = computeCarouselLayout(1440, 900);

    expect(layout.isMobile).toBe(false);
    expect(layout.slideWidth).toBe(1080);
    expect(layout.slideHeight).toBe(600);
    expect(layout.slideWidth / layout.slideHeight).toBeCloseTo(1.8, 5);
  });
});

describe("computeTrackOffset", () => {
  it("advances one card width plus gap per index", () => {
    const layout = {
      edgeFade: 18,
      slideWidth: 300,
      slideGap: 16,
    };

    expect(computeTrackOffset(0, 4, layout)).toBe(18);
    expect(computeTrackOffset(1, 4, layout)).toBe(18 - 316);
  });
});
