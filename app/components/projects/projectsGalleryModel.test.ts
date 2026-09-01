import { describe, expect, it } from "vitest";

import type { ProjectSummary } from "./projectData";
import {
  getProjectIdsByCategory,
  resolveProjectName,
} from "./projectsGalleryModel";

const projects: ProjectSummary[] = [
  { id: 1, name: "One", categoryId: "mobility-robot" },
  { id: 2, name: "Two", categoryId: "healthcare" },
  { id: 3, name: "Three", categoryId: "mobility-robot" },
];

describe("projectsGalleryModel", () => {
  it("keeps source order when filtering by category", () => {
    expect(getProjectIdsByCategory(projects, "mobility-robot")).toEqual([1, 3]);
    expect(getProjectIdsByCategory(projects, "all-projects")).toEqual([
      1, 2, 3,
    ]);
  });

  it("resolves project names and preserves the fallback label", () => {
    expect(resolveProjectName(projects, 2)).toBe("Two");
    expect(resolveProjectName(projects, 9)).toBe("project 09");
  });
});
