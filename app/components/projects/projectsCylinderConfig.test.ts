import { describe, expect, it } from "vitest";

import {
  createCylinderRows,
  getCenteredAngleDistance,
  getNearestCardCenteredRotation,
  getProjectDeck,
  getSnappedRotation,
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
  });
});
