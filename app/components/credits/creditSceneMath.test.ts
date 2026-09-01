import { describe, expect, it } from "vitest";

import {
  getOffscreenFragmentPosition,
  getPolygonBounds,
  getPolygonCentroid,
  getSelectedFragmentPosition,
  isPointInsidePolygon,
} from "./creditSceneMath";

const square = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const;

describe("creditSceneMath", () => {
  it("calculates polygon geometry without Three.js", () => {
    expect(isPointInsidePolygon(0, 0, square)).toBe(true);
    expect(isPointInsidePolygon(2, 0, square)).toBe(false);
    expect(getPolygonCentroid(square)).toEqual([0, 0]);
    expect(getPolygonBounds(square)).toEqual({
      minX: -1,
      maxX: 1,
      minY: -1,
      maxY: 1,
    });
  });

  it("keeps desktop and mobile selected anchors stable", () => {
    const bounds = { minX: -5, maxX: -1, maxY: 2 };

    expect(getSelectedFragmentPosition(-2, bounds, 0.72, false)).toEqual([
      -0.9500000000000002,
      0.45999999999999996,
      0.95,
    ]);
    const mobilePosition = getSelectedFragmentPosition(
      -2,
      bounds,
      0.58,
      true,
    );
    expect(mobilePosition[0]).toBeCloseTo(0.55);
    expect(mobilePosition[1]).toBeCloseTo(0.42);
    expect(mobilePosition[2]).toBe(0.95);
  });

  it("sends centered fragments toward the lower offscreen anchor", () => {
    expect(getOffscreenFragmentPosition(0, 0)).toEqual([0, -7, -0.7]);
  });
});
