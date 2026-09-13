import { describe, expect, it } from "vitest";

import {
  getHeaderOrbFallback,
  getHeaderOrbTarget,
  getSplashDiskCover,
  shouldPlayLandingSplash,
} from "./landingSplashModel";

describe("landingSplashModel", () => {
  it("uses the desktop header orb to the left of the centered nav", () => {
    expect(getHeaderOrbFallback(false, 1440)).toEqual({
      x: 480,
      y: 36,
      radius: 26,
    });
  });

  it("uses the mobile header orb at the top-right", () => {
    expect(getHeaderOrbFallback(true, 390)).toEqual({
      x: 352,
      y: 32,
      radius: 22,
    });
  });

  it("prefers the measured orb center when available", () => {
    expect(
      getHeaderOrbTarget(
        { left: 100, top: 20, width: 44, height: 44 },
        true,
        390,
      ),
    ).toEqual({
      x: 122,
      y: 42,
      radius: 22,
    });
  });

  it("covers the viewport from center before shrinking to the orb", () => {
    const cover = getSplashDiskCover(
      { x: 352, y: 38, radius: 22 },
      390,
      844,
    );

    expect(cover.dx).toBeCloseTo(390 / 2 - 352);
    expect(cover.dy).toBeCloseTo(844 / 2 - 38);
    expect(cover.scale).toBeGreaterThan(10);
  });

  it("keeps playing after the pending class is wiped if the load flag remains", () => {
    expect(shouldPlayLandingSplash(false, true)).toBe(true);
    expect(shouldPlayLandingSplash(true, false)).toBe(true);
    expect(shouldPlayLandingSplash(false, false)).toBe(false);
  });
});
