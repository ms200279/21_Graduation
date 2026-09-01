import {
  getCategoryIdFromSourceTag,
  getCategoryLabel,
  type ProjectTagCategoryId,
} from "./projectCategories";
import projectInfo from "@/app/data/projectinfo.json";
import {
  parseProjectInfo,
  type SourceCopyBlock,
  type SourceProject,
} from "./projectDataSchema";

export type ProjectStorySectionId =
  | "background"
  | "goal"
  | "feature1"
  | "feature2"
  | "feature3";

export type ProjectStorySection = {
  id: ProjectStorySectionId;
  title: string;
  subtitle: string;
  body: string;
  imageSrc: string | null;
};

export type ProjectDetailData = {
  id: number;
  slug: string;
  name: string;
  nameKo: string;
  tag: string;
  categoryId: ProjectTagCategoryId;
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

const FEATURE_SECTION_IDS = [
  "feature1",
  "feature2",
  "feature3",
] as const satisfies ProjectStorySectionId[];

function normalizeCopy(value: string | undefined) {
  return (value ?? "")
    .replace(/[\u2028\u2029]/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();
}

function createStorySection(
  id: ProjectStorySectionId,
  copy: SourceCopyBlock | undefined,
): ProjectStorySection {
  return {
    id,
    title: STORY_SECTION_TITLES[id],
    subtitle: normalizeCopy(copy?.subtitle),
    body: normalizeCopy(copy?.body),
    imageSrc: null,
  };
}

function mapSourceProject(source: SourceProject): ProjectDetailData {
  const categoryId = getCategoryIdFromSourceTag(source.tag);
  const name = normalizeCopy(source.title.en) || normalizeCopy(source.title.ko);
  const features = source.features ?? [];

  return {
    id: source.projectNo,
    slug: String(source.projectNo).padStart(2, "0"),
    name,
    nameKo: normalizeCopy(source.title.ko),
    tag: getCategoryLabel(categoryId),
    categoryId,
    body: normalizeCopy(source.oneLine),
    thumbnailSrc: null,
    sections: [
      createStorySection("background", source.background),
      createStorySection("goal", source.goal),
      ...FEATURE_SECTION_IDS.map((sectionId, index) =>
        createStorySection(sectionId, features[index]),
      ),
    ],
    details: Array.from({ length: 3 }, (_, detailIndex) => ({
      id: `detail-${detailIndex + 1}`,
      imageSrc: null,
      body: normalizeCopy(source.detail?.[detailIndex]?.body),
    })),
  };
}

export type ProjectSummary = {
  id: number;
  name: string;
  categoryId: ProjectTagCategoryId;
};

export const PROJECT_DETAILS: ProjectDetailData[] = parseProjectInfo(projectInfo)
  .slice()
  .sort((left, right) => left.projectNo - right.projectNo)
  .map(mapSourceProject);

export const PROJECT_SUMMARIES: ProjectSummary[] = PROJECT_DETAILS.map(
  (project) => ({
    id: project.id,
    name: project.name,
    categoryId: project.categoryId,
  }),
);

export function getProjectDetailBySlug(slug: string) {
  return PROJECT_DETAILS.find((project) => project.slug === slug) ?? null;
}

export function getProjectDetailById(id: number) {
  return PROJECT_DETAILS.find((project) => project.id === id) ?? null;
}
