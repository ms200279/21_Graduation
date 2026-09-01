import { PROJECT_CARD_COUNT } from "./projectsCylinderConfig";

export type ProjectStorySectionId =
  | "background"
  | "goal"
  | "feature1"
  | "feature2"
  | "feature3";

export type ProjectStorySection = {
  id: ProjectStorySectionId;
  title: string;
  body: string;
  imageSrc: string | null;
};

export type ProjectDetailData = {
  id: number;
  slug: string;
  name: string;
  tag: string;
  body: string;
  thumbnailSrc: string | null;
  sections: ProjectStorySection[];
  details: {
    id: string;
    imageSrc: string | null;
    body: string;
  }[];
};

const STORY_SECTION_TITLES: Record<ProjectStorySectionId, string> = {
  background: "Background",
  goal: "Goal",
  feature1: "Feature 1",
  feature2: "Feature 2",
  feature3: "Feature 3",
};

const STORY_SECTION_IDS = Object.keys(
  STORY_SECTION_TITLES,
) as ProjectStorySectionId[];

function createProjectDetail(id: number): ProjectDetailData {
  const projectNumber = String(id).padStart(2, "0");

  return {
    id,
    slug: projectNumber,
    name: `Project ${projectNumber}`,
    tag: "Project Tag",
    body: "프로젝트를 소개하는 본문이 들어갈 영역입니다. 실제 작품 데이터와 이미지가 준비되면 이 내용을 교체할 수 있습니다.",
    thumbnailSrc: null,
    sections: STORY_SECTION_IDS.map((sectionId) => ({
      id: sectionId,
      title: STORY_SECTION_TITLES[sectionId],
      body: `${STORY_SECTION_TITLES[sectionId]}에 대한 프로젝트 설명이 들어갈 영역입니다. 핵심 배경과 목표, 기능을 간결하게 전달합니다.`,
      imageSrc: null,
    })),
    details: Array.from({ length: 3 }, (_, detailIndex) => ({
      id: `detail-${detailIndex + 1}`,
      imageSrc: null,
      body: `Detail ${detailIndex + 1}에 대한 설명이 들어갈 영역입니다. 이미지와 함께 세부 내용을 전달합니다.`,
    })),
  };
}

export const PROJECT_DETAILS = Array.from(
  { length: PROJECT_CARD_COUNT },
  (_, index) => createProjectDetail(index + 1),
);

export function getProjectDetailBySlug(slug: string) {
  return PROJECT_DETAILS.find((project) => project.slug === slug) ?? null;
}

export function getProjectDetailPath(id: number) {
  return `/projectspage/${String(id).padStart(2, "0")}`;
}
