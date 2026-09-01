import { notFound } from "next/navigation";

import ProjectDetail from "@/app/components/projects/ProjectDetail";
import {
  getProjectDetailBySlug,
  PROJECT_DETAILS,
} from "@/app/components/projects/projectData";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

export function generateStaticParams() {
  return PROJECT_DETAILS.map((project) => ({
    projectId: project.slug,
  }));
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectId } = await params;
  const project = getProjectDetailBySlug(projectId);

  if (!project) {
    notFound();
  }

  return <ProjectDetail project={project} />;
}
