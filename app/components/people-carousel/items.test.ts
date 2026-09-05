import { describe, expect, it } from "vitest";

import { PEOPLE_CAROUSEL_ITEMS } from "./items";

describe("PEOPLE_CAROUSEL_ITEMS", () => {
  it("sorts the roster by Korean name and fills contact fields", () => {
    const names = PEOPLE_CAROUSEL_ITEMS.map((person) => person.name);

    expect(PEOPLE_CAROUSEL_ITEMS).toHaveLength(98);
    expect(names).toEqual(
      [...names].sort((left, right) => left.localeCompare(right, "ko")),
    );
    expect(PEOPLE_CAROUSEL_ITEMS[0]).toMatchObject({
      id: "1",
      name: "공건호",
      phone: "010-4612-4603",
      role: "Industrial Design",
      categoryId: "industrial-design",
    });
    expect(
      PEOPLE_CAROUSEL_ITEMS.find((person) => person.name === "곽영경"),
    ).toMatchObject({
      phone: "010-8362-4343",
      role: "Media Design",
      categoryId: "media-design",
    });
  });
});
