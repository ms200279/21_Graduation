import peopleRoster from "@/app/data/people.json";

import { getDepartment, type PeopleDepartmentId } from "./peopleCategories";
import { parsePeopleRoster } from "./peopleDataSchema";
import { getPeoplePhotoSrc } from "./peopleImages";

export type PeopleCarouselItem = {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  photoSrc?: string;
  categoryId?: PeopleDepartmentId;
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

    return {
      id: String(index + 1),
      name: person.name,
      role: department?.label,
      phone: person.phone || undefined,
      photoSrc: getPeoplePhotoSrc(person.name, person.studentId),
      categoryId: department?.categoryId,
    };
  });
