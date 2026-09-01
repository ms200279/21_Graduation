export const PROJECTS_CATEGORY_OPTIONS = [
  { id: "all-projects", label: "All Projects" },
  { id: "mobility-robot", label: "Mobility/Robot" },
  { id: "public-design", label: "Public Design" },
  { id: "it-education", label: "IT/Education" },
  { id: "smart-life", label: "Smart Life" },
  { id: "healthcare", label: "Healthcare" },
] as const;

export type ProjectsCategoryId =
  (typeof PROJECTS_CATEGORY_OPTIONS)[number]["id"];

export type ProjectTagCategoryId = Exclude<ProjectsCategoryId, "all-projects">;

export type ProjectSourceTag = 1 | 2 | 3 | 4 | 5;

const CATEGORY_BY_SOURCE_TAG: Record<ProjectSourceTag, ProjectTagCategoryId> = {
  1: "mobility-robot",
  2: "it-education",
  3: "smart-life",
  4: "healthcare",
  5: "public-design",
};

export function isProjectSourceTag(tag: number): tag is ProjectSourceTag {
  return Number.isInteger(tag) && tag >= 1 && tag <= 5;
}

export function getCategoryIdFromSourceTag(
  tag: number,
): ProjectTagCategoryId {
  if (!isProjectSourceTag(tag)) {
    throw new Error(`Unknown project source tag: ${tag}`);
  }

  return CATEGORY_BY_SOURCE_TAG[tag];
}

export function getCategoryLabel(categoryId: ProjectsCategoryId) {
  return (
    PROJECTS_CATEGORY_OPTIONS.find((option) => option.id === categoryId)
      ?.label ?? "All Projects"
  );
}
