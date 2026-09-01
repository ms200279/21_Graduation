import { describe, expect, it } from "vitest";

import { getCategoryIdFromSourceTag } from "./projectCategories";
import { parseProjectInfo } from "./projectDataSchema";

const validProject = {
  projectNo: 7,
  tag: 3,
  title: { ko: "프로젝트", en: "Project" },
  oneLine: "Summary",
  background: { subtitle: "Background subtitle", body: "Background body" },
  goal: { subtitle: "Goal subtitle", body: "Goal body" },
  features: [{ subtitle: "Feature subtitle", body: "Feature body" }],
  detail: [{ body: "Detail body" }],
};

describe("parseProjectInfo", () => {
  it("accepts a valid project fixture", () => {
    expect(parseProjectInfo([validProject])).toEqual([validProject]);
  });

  it("rejects malformed fields with their project context", () => {
    expect(() =>
      parseProjectInfo([
        {
          ...validProject,
          features: [{ subtitle: 42, body: "Feature body" }],
        },
      ]),
    ).toThrow("Project 7.features[0].subtitle must be a string");
  });

  it("rejects unknown numeric source tags with project context", () => {
    expect(() => parseProjectInfo([{ ...validProject, tag: 6 }])).toThrow(
      "Project 7 has unknown source tag: 6",
    );
  });

  it("rejects a non-array root value", () => {
    expect(() => parseProjectInfo({ project: validProject })).toThrow(
      "Project data must be an array",
    );
  });
});

describe("getCategoryIdFromSourceTag", () => {
  it("maps all known tags and rejects unknown tags", () => {
    expect([1, 2, 3, 4, 5].map(getCategoryIdFromSourceTag)).toEqual([
      "mobility-robot",
      "it-education",
      "smart-life",
      "healthcare",
      "public-design",
    ]);
    expect(() => getCategoryIdFromSourceTag(0)).toThrow(
      "Unknown project source tag: 0",
    );
  });
});
