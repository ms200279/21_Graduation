import { describe, expect, it } from "vitest";

import {
  createCylinderRows,
  getCenteredAngleDistance,
  getNearestCardCenteredRotation,
  getProjectDeck,
  getRotationStepTowardIndex,
  getSnappedRotation,
  pickFrontCylinderCardIndex,
  pickScreenNeighborCardIndex,
  ROW_CARD_COUNT,
} from "./projectsCylinderConfig";

describe("projectsCylinderConfig", () => {
  it("creates a deterministic deck without losing project ids", () => {
    const ids = Array.from({ length: 30 }, (_, index) => index + 1);

    expect(getProjectDeck(4, ids)).toEqual(getProjectDeck(4, ids));
    expect(getProjectDeck(4, ids).map(({ id }) => id).sort((a, b) => a - b)).toEqual(
      ids,
    );
  });

  it("fills both cylinder rows for categories smaller than 24 projects", () => {
    const ids = [2, 4, 8, 16, 32, 64, 77];
    const rows = createCylinderRows(ids);

    expect(rows.upper).toHaveLength(ROW_CARD_COUNT);
    expect(rows.lower).toHaveLength(ROW_CARD_COUNT);
    expect([...rows.upper, ...rows.lower].every(({ id }) => ids.includes(id))).toBe(
      true,
    );
  });

  it("normalizes and snaps rotations around the centered angle", () => {
    expect(getCenteredAngleDistance(350)).toBe(-10);
    expect(getCenteredAngleDistance(725)).toBe(5);
    expect(getSnappedRotation(44, 30)).toBe(30);
    expect(getNearestCardCenteredRotation(3, 30, 280)).toBe(270);
    expect(getRotationStepTowardIndex(1, 30, 0)).toBe(-1);
    expect(getRotationStepTowardIndex(11, 30, 0)).toBe(1);
  });

  it("picks the screen-space neighbor regardless of cylinder rotation sign", () => {
    const cards = [
      { index: 0, centerX: 200 },
      { index: 1, centerX: 80 },
      { index: 2, centerX: 330 },
    ];

    expect(pickFrontCylinderCardIndex(cards, 195)).toBe(0);
    expect(pickScreenNeighborCardIndex(cards, 0, "left")).toBe(1);
    expect(pickScreenNeighborCardIndex(cards, 0, "right")).toBe(2);
  });
});
