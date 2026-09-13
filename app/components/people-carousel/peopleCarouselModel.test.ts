import { describe, expect, it } from "vitest";

import {
  easeOutCubic,
  getBatchCount,
  getCarouselRigTransform,
  getExpandedTargetRect,
  isMobileCarouselSlotVisible,
  MOBILE_SCROLL_VH_PER_CARD,
  getCarouselStateFromItemPosition,
  getItemIndexFromScrollProgress,
  getPeopleCarouselTrackHeightVh,
  getScrollProgressForItemIndex,
  getSnapDurationMs,
  getZoneRotationForItemIndex,
  isCarouselCardFacingFront,
  isSlotInGlassEffectWindow,
  mod,
  resolveStepOriginItemIndex,
  resolveZoneSnapItemIndex,
  shouldOmitWrappedCarouselSlot,
  SCROLL_VH_PER_CARD,
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

  it("keeps a desktop scroll range when only two cards remain", () => {
    expect(getPeopleCarouselTrackHeightVh(0)).toBe(100);
    expect(getPeopleCarouselTrackHeightVh(1)).toBe(100);
    expect(getPeopleCarouselTrackHeightVh(2)).toBe(
      100 + SCROLL_VH_PER_CARD,
    );
    expect(getPeopleCarouselTrackHeightVh(98)).toBe(
      100 + 97 * SCROLL_VH_PER_CARD,
    );
  });

  it("keeps a scrollable range on mobile when only two cards remain", () => {
    expect(getPeopleCarouselTrackHeightVh(0, { isMobile: true })).toBe(100);
    expect(getPeopleCarouselTrackHeightVh(1, { isMobile: true })).toBe(100);
    expect(getPeopleCarouselTrackHeightVh(2, { isMobile: true })).toBe(
      100 + MOBILE_SCROLL_VH_PER_CARD,
    );
    expect(getPeopleCarouselTrackHeightVh(98, { isMobile: true })).toBe(
      100 + 97 * MOBILE_SCROLL_VH_PER_CARD,
    );
  });

  it("resolves snap zones and fallback step origins", () => {
    expect(resolveZoneSnapItemIndex(4.1, 10)).toBe(4);
    expect(resolveZoneSnapItemIndex(4.49, 10)).toBeNull();
    expect(resolveStepOriginItemIndex(4.6, 10)).toBe(5);
    expect(resolveZoneSnapItemIndex(4.49, 10, { threshold: 0.5 })).toBe(4);
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

  it("hides cards on the far side of the cylinder", () => {
    expect(isCarouselCardFacingFront(0)).toBe(true);
    expect(isCarouselCardFacingFront(90)).toBe(true);
    expect(isCarouselCardFacingFront(180)).toBe(false);
    expect(isCarouselCardFacingFront(-163)).toBe(false);
    expect(isCarouselCardFacingFront(350)).toBe(true);
  });

  it("centers the mobile cylinder without the desktop yaw", () => {
    expect(getCarouselRigTransform({ isMobile: true })).toContain("rotateY(0deg)");
    expect(getCarouselRigTransform({ isMobile: true })).toContain("scale(0.7)");
    expect(getCarouselRigTransform({ isMobile: true })).toContain("translate(0,");
    expect(getCarouselRigTransform()).toContain("rotateY(10deg)");
  });

  it("hides wrapped cards above the front mobile slot", () => {
    expect(isMobileCarouselSlotVisible(0, 0, 11)).toBe(true);
    expect(isMobileCarouselSlotVisible(2, 0, 11)).toBe(true);
    expect(isMobileCarouselSlotVisible(3, 0, 11)).toBe(false);
    expect(isMobileCarouselSlotVisible(10, 0, 11)).toBe(false);
  });

  it("sizes the mobile expanded profile as a portrait playing card", () => {
    const rect = getExpandedTargetRect(390, 844, { isMobile: true });

    expect(rect.width).toBe(320);
    expect(rect.width / rect.height).toBeCloseTo(5 / 7);
    expect(rect.left).toBeGreaterThan(0);
    expect(rect.left + rect.width).toBeLessThanOrEqual(390);
  });

  it("eases snaps without overshoot", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeLessThan(0.9);
  });

  it("scales snap duration to the remaining card distance", () => {
    expect(getSnapDurationMs(0.1, false)).toBe(180);
    expect(getSnapDurationMs(0.75, false)).toBe(315);
    expect(getSnapDurationMs(2, false)).toBe(420);
    expect(getSnapDurationMs(0.75, true)).toBe(390);
  });
});
