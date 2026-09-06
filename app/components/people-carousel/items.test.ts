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
      photoSrc: encodeURI("/people/2023192001_공건호.png"),
    });
    expect(
      PEOPLE_CAROUSEL_ITEMS.find((person) => person.name === "곽영경"),
    ).toMatchObject({
      phone: "010-8362-4343",
      role: "Media Design",
      categoryId: "media-design",
      photoSrc: encodeURI("/people/2023194001_곽영경.png"),
    });
    expect(
      PEOPLE_CAROUSEL_ITEMS.filter((person) => person.name === "김은서").map(
        (person) => person.photoSrc,
      ),
    ).toEqual([
      encodeURI("/people/2023192005_김은서.png"),
      encodeURI("/people/2023192037_김은서.png"),
    ]);
    expect(
      PEOPLE_CAROUSEL_ITEMS.find((person) => person.name === "문기돈")
        ?.photoSrc,
    ).toBeUndefined();
  });
});
