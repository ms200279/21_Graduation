import type { ProjectsCategoryId } from "./projectCategories";
import type { ProjectSummary } from "./projectData";

export function getProjectIdsByCategory(
  projects: ProjectSummary[],
  categoryId: ProjectsCategoryId,
) {
  if (categoryId === "all-projects") {
    return projects.map((project) => project.id);
  }

  return projects
    .filter((project) => project.categoryId === categoryId)
    .map((project) => project.id);
}

export function resolveProjectName(projects: ProjectSummary[], id: number) {
  return (
    projects.find((project) => project.id === id)?.name ??
    `project ${String(id).padStart(2, "0")}`
  );
}
