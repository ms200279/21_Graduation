"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getProjectDetailPath, isProjectDetailPath } from "@/app/utils/routes";
import CylinderRow from "./CylinderRow";
import type { ProjectsCategoryId } from "./projectCategories";
import type { ProjectSummary } from "./projectData";
import ProjectsGridGallery from "./ProjectsGridGallery";
import {
  getProjectIdsByCategory,
  resolveProjectName,
} from "./projectsGalleryModel";
import { getAllProjectCards } from "./projectsCylinderConfig";
import type { ProjectsViewMode } from "./projectsViewMode";
import { useProjectsDeckState } from "./useProjectsDeckState";

type ProjectsCylinderGalleryProps = {
  viewMode?: ProjectsViewMode;
  categoryId?: ProjectsCategoryId;
  projects: ProjectSummary[];
};

export default function ProjectsCylinderGallery({
  viewMode = "cylinder",
  categoryId = "all-projects",
  projects,
}: ProjectsCylinderGalleryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isPaused = isProjectDetailPath(pathname);
  const projectIds = getProjectIdsByCategory(projects, categoryId);
  const {
    upperCards,
    lowerCards,
    replaceUpperCard,
    replaceLowerCard,
  } = useProjectsDeckState(projectIds);
  const openProject = useCallback(
    (id: number) => {
      router.push(getProjectDetailPath(id), { scroll: false });
    },
    [router],
  );
  const getProjectName = useCallback(
    (id: number) => resolveProjectName(projects, id),
    [projects],
  );

  if (viewMode === "grid") {
    return (
      <ProjectsGridGallery
        cards={getAllProjectCards(projectIds)}
        onCardSelect={openProject}
        getProjectName={getProjectName}
      />
    );
  }

  return (
    <section
      className="projects-cylinder-gallery"
      aria-label="Project archive carousel"
    >
      <CylinderRow
        cards={upperCards}
        direction={1}
        label="Upper project carousel row"
        isPaused={isPaused}
        onCardRecycle={replaceUpperCard}
        onCardSelect={openProject}
        getProjectName={getProjectName}
      />
      <CylinderRow
        cards={lowerCards}
        direction={-1}
        label="Lower project carousel row"
        isPaused={isPaused}
        onCardRecycle={replaceLowerCard}
        onCardSelect={openProject}
        getProjectName={getProjectName}
      />
    </section>
  );
}
