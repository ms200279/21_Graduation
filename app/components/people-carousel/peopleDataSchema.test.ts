import { describe, expect, it } from "vitest";

import peopleRoster from "@/app/data/people.json";

import { parsePeopleRoster } from "./peopleDataSchema";

describe("parsePeopleRoster", () => {
  it("accepts the exhibition people roster", () => {
    const people = parsePeopleRoster(peopleRoster);

    expect(people).toHaveLength(98);
    expect(people[0]).toMatchObject({
      studentId: "2023192001",
      name: "공건호",
      majorTag: 2,
    });
  });

  it("rejects an invalid major tag", () => {
    expect(() =>
      parsePeopleRoster([
        {
          studentId: "2023192001",
          name: "공건호",
          majorTag: 3,
        },
      ]),
    ).toThrow(/majorTag/);
  });
});
