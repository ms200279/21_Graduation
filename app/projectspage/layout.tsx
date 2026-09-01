import ProjectsPageContent from "@/app/components/projects/ProjectsPageContent";
import { PROJECT_SUMMARIES } from "@/app/components/projects/projectData";
import type { ReactNode } from "react";

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  // Keep the gallery mounted while a detail route renders in the portal so
  // category, view mode, cylinder position, and document scroll survive close.
  return (
    <>
      <ProjectsPageContent projects={PROJECT_SUMMARIES} />
      {children}
    </>
  );
}
