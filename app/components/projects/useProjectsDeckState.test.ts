import { describe, expect, it } from "vitest";

import { drawProjectDeckCard } from "./useProjectsDeckState";

describe("drawProjectDeckCard", () => {
  it("draws the first unblocked card and removes it from the deck", () => {
    const result = drawProjectDeckCard(
      [{ id: 1 }, { id: 2 }, { id: 3 }],
      1,
      [1, 2, 3],
      [{ id: 1 }],
    );

    expect(result).toEqual({
      card: { id: 2 },
      deck: [{ id: 1 }, { id: 3 }],
      seed: 1,
    });
  });

  it("reseeds an exhausted deck and avoids blocked ids", () => {
    const result = drawProjectDeckCard([], 4, [1, 2, 3], [{ id: 1 }]);

    expect(result.seed).toBe(5);
    expect(result.card.id).not.toBe(1);
    expect(result.deck).not.toContainEqual(result.card);
  });

  it("allows duplicates when all unique ids are already visible", () => {
    const result = drawProjectDeckCard(
      [{ id: 2 }, { id: 1 }],
      1,
      [1, 2],
      [{ id: 1 }, { id: 2 }],
    );

    expect(result.card).toEqual({ id: 2 });
  });
});
