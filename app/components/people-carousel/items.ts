import peopleRoster from "@/app/data/people.json";
import { getProjectDetailById } from "@/app/components/projects/projectData";
import {
  getMemberDetailPath,
  getProjectDetailPath,
} from "@/app/utils/routes";

import { getDepartment, type PeopleDepartmentId } from "./peopleCategories";
import { parsePeopleRoster } from "./peopleDataSchema";
import { getPeoplePhotoSrc } from "./peopleImages";

export const GRADUATION_COMMITTEE_STUDENT_IDS: ReadonlySet<string> = new Set([
  "2021190004",
  "2021192004",
  "2021192037",
  "2021194016",
  "2022190020",
  "2023190030",
  "2023190031",
  "2023190040",
  "2023190041",
  "2023192031",
  "2023192037",
]);

export type PeopleCarouselItem = {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  photoSrc?: string;
  categoryId?: PeopleDepartmentId;
  projectNo: number;
  projectTitle: string;
  projectHref: string;
  memberHref: string;
  authorOrder: number;
  isGraduationCommittee: boolean;
};

export const PEOPLE_CAROUSEL_ITEMS: PeopleCarouselItem[] = parsePeopleRoster(
  peopleRoster,
)
  .slice()
  .sort((left, right) => {
    const byName = left.name.localeCompare(right.name, "ko");

    if (byName !== 0) {
      return byName;
    }

    return left.studentId.localeCompare(right.studentId);
  })
  .map((person, index) => {
    const department = getDepartment(person.majorTag);
    const project = getProjectDetailById(person.projectNo);

    return {
      id: String(index + 1),
      name: person.name,
      role: department?.label,
      phone: person.phone || undefined,
      photoSrc: getPeoplePhotoSrc(person.name, person.studentId),
      categoryId: department?.categoryId,
      projectNo: person.projectNo,
      projectTitle:
        project?.name || person.projectTitle || `Project ${person.projectNo}`,
      projectHref: getProjectDetailPath(person.projectNo),
      memberHref: getMemberDetailPath(index),
      authorOrder: person.authorOrder ?? 1,
      isGraduationCommittee: GRADUATION_COMMITTEE_STUDENT_IDS.has(
        person.studentId,
      ),
    };
  });

export function getProjectAuthors(projectNo: number) {
  return PEOPLE_CAROUSEL_ITEMS.filter(
    (person) => person.projectNo === projectNo,
  )
    .slice()
    .sort((left, right) => {
      const byOrder = left.authorOrder - right.authorOrder;

      if (byOrder !== 0) {
        return byOrder;
      }

      return left.name.localeCompare(right.name, "ko");
    });
}
