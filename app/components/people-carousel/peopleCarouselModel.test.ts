import { describe, expect, it } from "vitest";

import {
  getBatchCount,
  getCarouselStateFromItemPosition,
  getItemIndexFromScrollProgress,
  getScrollProgressForItemIndex,
  getZoneRotationForItemIndex,
  isSlotInGlassEffectWindow,
  mod,
  resolveStepOriginItemIndex,
  resolveZoneSnapItemIndex,
  shouldOmitWrappedCarouselSlot,
} from "./peopleCarouselModel";

describe("peopleCarouselModel", () => {
  it("keeps modulo and batch calculations stable", () => {
    expect(mod(-1, 11)).toBe(10);
    expect(getBatchCount(99, 11)).toBe(9);
    expect(getBatchCount(0, 11)).toBe(0);
  });

  it("maps item positions to batch rotation", () => {
    expect(getCarouselStateFromItemPosition(12, 99, 11, true)).toEqual({
      itemIndex: 12,
      batchIndex: 1,
      rotation: 360 / 11,
    });
    expect(getZoneRotationForItemIndex(12, 11)).toBe(360 / 11);
  });

  it("round-trips item indexes and scroll progress", () => {
    const progress = getScrollProgressForItemIndex(49, 98);

    expect(progress).toBe(0.5);
    expect(getItemIndexFromScrollProgress(progress, 98)).toBe(49);
  });

  it("resolves snap zones and fallback step origins", () => {
    expect(resolveZoneSnapItemIndex(4.1, 10)).toBe(4);
    expect(resolveZoneSnapItemIndex(4.49, 10)).toBeNull();
    expect(resolveStepOriginItemIndex(4.6, 10)).toBe(5);
  });

  it("keeps a single search result visible in the first slot", () => {
    expect(
      shouldOmitWrappedCarouselSlot({
        batchIndex: 0,
        slotIndex: 0,
        zoneSlotInBatch: 0,
        itemCount: 1,
        batchSize: 11,
      }),
    ).toBe(false);
  });

  it("still hides the wrapped last-batch neighbor when more than one card remains", () => {
    expect(
      shouldOmitWrappedCarouselSlot({
        batchIndex: 0,
        slotIndex: 0,
        zoneSlotInBatch: 1,
        itemCount: 2,
        batchSize: 11,
      }),
    ).toBe(true);
  });

  it("wraps the glass effect window across slot boundaries", () => {
    expect(isSlotInGlassEffectWindow(10, 0, 11)).toBe(true);
    expect(isSlotInGlassEffectWindow(2, 0, 11)).toBe(true);
    expect(isSlotInGlassEffectWindow(3, 0, 11)).toBe(false);
  });
});
