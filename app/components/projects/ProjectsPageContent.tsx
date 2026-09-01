"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { isProjectDetailPath } from "@/app/utils/routes";
import ProjectsCategoryFilter from "./ProjectsCategoryFilter";
import ProjectsCylinderGallery from "./ProjectsCylinderGallery";
import type { ProjectsCategoryId } from "./projectCategories";
import type { ProjectSummary } from "./projectData";
import type { ProjectsViewMode } from "./projectsViewMode";

function ProjectsViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: ProjectsViewMode;
  onChange: (viewMode: ProjectsViewMode) => void;
}) {
  return (
    <div className="projects-view-toggle" aria-label="Project view mode">
      <button
        type="button"
        className={[
          "projects-view-toggle__button",
          viewMode === "cylinder" ? "projects-view-toggle__button--active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Cylinder view"
        aria-pressed={viewMode === "cylinder"}
        onClick={() => onChange("cylinder")}
      >
        <svg
          className="projects-view-toggle__icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4.5 6.25C4.5 4.87 6.96 3.75 10 3.75C13.04 3.75 15.5 4.87 15.5 6.25V13.75C15.5 15.13 13.04 16.25 10 16.25C6.96 16.25 4.5 15.13 4.5 13.75V6.25Z"
            stroke="currentColor"
            strokeWidth="1.45"
            strokeLinejoin="round"
          />
          <path
            d="M4.5 6.25C4.5 7.63 6.96 8.75 10 8.75C13.04 8.75 15.5 7.63 15.5 6.25"
            stroke="currentColor"
            strokeWidth="1.45"
            strokeLinecap="round"
          />
          <path
            d="M6.75 8.25V15.3M13.25 8.25V15.3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.72"
          />
        </svg>
      </button>
      <button
        type="button"
        className={[
          "projects-view-toggle__button",
          viewMode === "grid" ? "projects-view-toggle__button--active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
        onClick={() => onChange("grid")}
      >
        <svg
          className="projects-view-toggle__icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 4H8V8H4V4ZM12 4H16V8H12V4ZM4 12H8V16H4V12ZM12 12H16V16H12V12Z"
            stroke="currentColor"
            strokeWidth="1.45"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export default function ProjectsPageContent({
  projects,
}: {
  projects: ProjectSummary[];
}) {
  const pathname = usePathname();
  const isDetailOpen = isProjectDetailPath(pathname);
  const [viewMode, setViewMode] = useState<ProjectsViewMode>("cylinder");
  const [activeCategory, setActiveCategory] =
    useState<ProjectsCategoryId>("all-projects");

  return (
    <main
      className="projects-page mx-auto min-h-screen max-w-6xl bg-white 2xl:max-w-[100rem]"
      aria-hidden={isDetailOpen}
      inert={isDetailOpen ? true : undefined}
    >
      <ProjectsCategoryFilter
        isSticky={viewMode === "cylinder"}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        actionSlot={
          <ProjectsViewToggle viewMode={viewMode} onChange={setViewMode} />
        }
      />
      <ProjectsCylinderGallery
        key={activeCategory}
        viewMode={viewMode}
        categoryId={activeCategory}
        projects={projects}
      />
    </main>
  );
}
