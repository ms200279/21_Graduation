import { describe, expect, it } from "vitest";

import {
  canNestedElementConsumeDelta,
  easeInOutCubic,
  getNearestSnapIndex,
  getNextPagedSectionIndex,
  getPagedSnapDirection,
  isDominantHorizontalWheel,
  shouldUsePagedWheelSnap,
} from "./pagedSnapScroll";

describe("paged snap helpers", () => {
  it("eases in and out without overshoot", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
  });

  it("snaps to the nearest section offset", () => {
    expect(getNearestSnapIndex(40, [0, 800, 1600])).toBe(0);
    expect(getNearestSnapIndex(500, [0, 800, 1600])).toBe(1);
    expect(getNearestSnapIndex(1500, [0, 800, 1600])).toBe(2);
  });

  it("ignores wheel ticks below the landing threshold", () => {
    expect(getPagedSnapDirection(49)).toBe(0);
    expect(getPagedSnapDirection(50)).toBe(1);
    expect(getPagedSnapDirection(-80)).toBe(-1);
  });

  it("steps one section and stays at the ends", () => {
    expect(getNextPagedSectionIndex(0, 1, 6)).toBe(1);
    expect(getNextPagedSectionIndex(0, -1, 6)).toBe(0);
    expect(getNextPagedSectionIndex(6, 1, 6)).toBe(6);
  });

  it("lets nested copy consume wheel until it hits an edge", () => {
    const nested = document.createElement("div");
    Object.defineProperty(nested, "scrollHeight", { value: 400 });
    Object.defineProperty(nested, "clientHeight", { value: 200 });
    nested.scrollTop = 80;
    nested.className = "project-detail-story__copy";
    const child = document.createElement("p");
    nested.append(child);
    document.body.append(nested);

    expect(
      canNestedElementConsumeDelta(child, 40, ".project-detail-story__copy"),
    ).toBe(true);
    nested.scrollTop = 200;
    expect(
      canNestedElementConsumeDelta(child, 40, ".project-detail-story__copy"),
    ).toBe(false);

    nested.remove();
  });

  it("leaves horizontal paging to the nested scroller", () => {
    const grid = document.createElement("div");
    grid.className = "project-detail-final__grid";
    const item = document.createElement("article");
    grid.append(item);

    const event = new WheelEvent("wheel", { deltaX: 80, deltaY: 10 });

    expect(
      isDominantHorizontalWheel(event, item, ".project-detail-final__grid"),
    ).toBe(true);
    expect(
      isDominantHorizontalWheel(
        new WheelEvent("wheel", { deltaX: 10, deltaY: 80 }),
        item,
        ".project-detail-final__grid",
      ),
    ).toBe(false);
  });

  it("keeps paged wheel snap on desktop only", () => {
    expect(shouldUsePagedWheelSnap(false)).toBe(true);
    expect(shouldUsePagedWheelSnap(true)).toBe(false);
  });
});
