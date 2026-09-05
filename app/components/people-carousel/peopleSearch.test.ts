import { describe, expect, it } from "vitest";

import { PEOPLE_CAROUSEL_ITEMS } from "./items";
import {
  filterPeopleByCategory,
  filterPeopleBySearch,
  getVisiblePeople,
  personNameMatchesQuery,
} from "./peopleSearch";

describe("people search and category filters", () => {
  it("filters people by department tag", () => {
    const media = filterPeopleByCategory(PEOPLE_CAROUSEL_ITEMS, "media-design");
    const industrial = filterPeopleByCategory(
      PEOPLE_CAROUSEL_ITEMS,
      "industrial-design",
    );

    expect(filterPeopleByCategory(PEOPLE_CAROUSEL_ITEMS, "everyone")).toHaveLength(
      98,
    );
    expect(media).toHaveLength(38);
    expect(industrial).toHaveLength(60);
    expect(media.every((person) => person.categoryId === "media-design")).toBe(
      true,
    );
    expect(media[0]?.name).toBe("곽영경");
    expect(industrial[0]?.name).toBe("공건호");
  });

  it("matches only hangul name substrings that exist in the roster", () => {
    expect(
      filterPeopleBySearch(PEOPLE_CAROUSEL_ITEMS, "곽영").map(
        (person) => person.name,
      ),
    ).toEqual(["곽영경"]);
    expect(
      filterPeopleBySearch(PEOPLE_CAROUSEL_ITEMS, "김가연").map(
        (person) => person.name,
      ),
    ).toEqual(["김가연"]);
    expect(
      filterPeopleBySearch(PEOPLE_CAROUSEL_ITEMS, "가연").map(
        (person) => person.name,
      ),
    ).toEqual(["김가연", "신가연"]);
    expect(
      filterPeopleBySearch(PEOPLE_CAROUSEL_ITEMS, "김").every((person) =>
        person.name.includes("김"),
      ),
    ).toBe(true);
    expect(filterPeopleBySearch(PEOPLE_CAROUSEL_ITEMS, "4612")).toHaveLength(98);
    expect(filterPeopleBySearch(PEOPLE_CAROUSEL_ITEMS, "ㄱㄱㅇ")).toHaveLength(98);
    expect(filterPeopleBySearch(PEOPLE_CAROUSEL_ITEMS, "zzzz")).toHaveLength(98);
    expect(personNameMatchesQuery("곽영경", "곽영경".normalize("NFD"))).toBe(
      true,
    );
    expect(personNameMatchesQuery("김가연", "김가")).toBe(true);
    expect(personNameMatchesQuery("김가연", "가연아")).toBe(false);
    expect(
      filterPeopleBySearch(PEOPLE_CAROUSEL_ITEMS, "김민석").map(
        (person) => person.name,
      ),
    ).toEqual(["김민석"]);
    expect(
      filterPeopleBySearch(PEOPLE_CAROUSEL_ITEMS, "이새연").map(
        (person) => person.name,
      ),
    ).toEqual(["이새연"]);
  });

  it("searches names across the full roster even when a department is selected", () => {
    expect(
      getVisiblePeople(PEOPLE_CAROUSEL_ITEMS, "industrial-design", "곽영경").map(
        (person) => person.name,
      ),
    ).toEqual(["곽영경"]);
  });
});
