import { describe, expect, it } from "vitest";

import {
  getLiftedOriginY,
  JELLYFISH_ORIGIN_RATIO,
  MIN_ORIGIN_RATIO,
  MOBILE_ORIGIN_SHIFT,
  readBottomOverlap,
  sceneTracksVisualViewport,
  TEXT_ORIGIN_RATIO,
} from "./particleKeyboard";

describe("readBottomOverlap", () => {
  it("returns the keyboard occlusion below the visual viewport", () => {
    expect(
      readBottomOverlap(844, {
        offsetTop: 0,
        height: 520,
      }),
    ).toBe(324);
  });

  it("subtracts visualViewport offsetTop when the page is panned", () => {
    expect(
      readBottomOverlap(844, {
        offsetTop: 80,
        height: 520,
      }),
    ).toBe(244);
  });

  it("returns 0 when the scene already fits in the visual viewport", () => {
    expect(
      readBottomOverlap(520, {
        offsetTop: 0,
        height: 520,
      }),
    ).toBe(0);
  });

  it("returns 0 without a visual viewport", () => {
    expect(readBottomOverlap(844, null)).toBe(0);
  });
});

describe("sceneTracksVisualViewport", () => {
  it("detects when the scene already matches the visual viewport", () => {
    expect(
      sceneTracksVisualViewport(
        { top: 0, height: 520 },
        { offsetTop: 0, height: 520 },
      ),
    ).toBe(true);
  });

  it("is false when the keyboard still covers the scene", () => {
    expect(
      sceneTracksVisualViewport(
        { top: 0, height: 844 },
        { offsetTop: 0, height: 520 },
      ),
    ).toBe(false);
  });
});

describe("getLiftedOriginY", () => {
  it("keeps the particle origin in the remaining visible band", () => {
    expect(getLiftedOriginY(844, TEXT_ORIGIN_RATIO, 80)).toBe((844 - 80) * 0.47);
  });

  it("centers jellyfish and text in the unobscured viewport", () => {
    expect(getLiftedOriginY(844, TEXT_ORIGIN_RATIO, 324)).toBe((844 - 324) * 0.47);
    expect(getLiftedOriginY(844, JELLYFISH_ORIGIN_RATIO, 0)).toBe(844 * 0.39);
  });

  it("does not pin particles into the header when the keyboard is tall", () => {
    expect(getLiftedOriginY(844, TEXT_ORIGIN_RATIO, 500)).toBeGreaterThan(844 * 0.18);
    expect(getLiftedOriginY(844, TEXT_ORIGIN_RATIO, 500)).toBe((844 - 500) * 0.47);
  });

  it("centers the group above a reserved input stack", () => {
    expect(getLiftedOriginY(520, TEXT_ORIGIN_RATIO, 0, MIN_ORIGIN_RATIO, 136)).toBe(
      (520 - 136) * 0.47,
    );
  });

  it("shifts the group down by the same amount the input is lowered", () => {
    expect(MOBILE_ORIGIN_SHIFT).toBe(32);
    expect(
      getLiftedOriginY(844, TEXT_ORIGIN_RATIO, 0, MIN_ORIGIN_RATIO, 136) +
        MOBILE_ORIGIN_SHIFT,
    ).toBe((844 - 136) * 0.47 + 32);
  });
});
