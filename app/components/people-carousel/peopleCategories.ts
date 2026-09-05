export const PEOPLE_CATEGORY_OPTIONS = [
  { id: "everyone", label: "Everyone" },
  { id: "industrial-design", label: "Industrial Design" },
  { id: "media-design", label: "Media Design" },
] as const;

export type PeopleCategoryId = (typeof PEOPLE_CATEGORY_OPTIONS)[number]["id"];
export type PeopleDepartmentId = Exclude<PeopleCategoryId, "everyone">;
export type PeopleMajorTag = 1 | 2;

const DEPARTMENT_BY_MAJOR_TAG = {
  1: {
    categoryId: "media-design",
    label: "Media Design",
  },
  2: {
    categoryId: "industrial-design",
    label: "Industrial Design",
  },
} as const satisfies Record<
  PeopleMajorTag,
  { categoryId: PeopleDepartmentId; label: string }
>;

export function isPeopleMajorTag(tag: number): tag is PeopleMajorTag {
  return tag === 1 || tag === 2;
}

export function getDepartment(majorTag: number) {
  if (!isPeopleMajorTag(majorTag)) {
    return undefined;
  }

  return DEPARTMENT_BY_MAJOR_TAG[majorTag];
}
