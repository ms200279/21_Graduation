import { describe, expect, it } from "vitest";

import {
  getLiftedOriginY,
  JELLYFISH_ORIGIN_RATIO,
  readBottomOverlap,
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

describe("getLiftedOriginY", () => {
  it("raises the particle origin by the keyboard shift", () => {
    expect(getLiftedOriginY(844, TEXT_ORIGIN_RATIO, 80)).toBe(844 * 0.47 - 80);
  });

  it("keeps jellyfish and text origins above the header band", () => {
    expect(getLiftedOriginY(844, TEXT_ORIGIN_RATIO, 500)).toBe(844 * 0.18);
    expect(getLiftedOriginY(844, JELLYFISH_ORIGIN_RATIO, 0)).toBe(844 * 0.39);
  });
});
