import type { PeopleCarouselItem } from "./items";
import type { PeopleCategoryId } from "./peopleCategories";

export function extractHangulSyllables(value: string) {
  return [...value.normalize("NFC")]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 0xac00 && code <= 0xd7a3;
    })
    .join("");
}

export function personNameMatchesQuery(name: string, query: string) {
  const normalizedName = extractHangulSyllables(name);
  const normalizedQuery = extractHangulSyllables(query);

  if (!normalizedQuery) {
    return true;
  }

  return normalizedName.includes(normalizedQuery);
}

export function filterPeopleByCategory(
  items: PeopleCarouselItem[],
  categoryId: PeopleCategoryId,
) {
  if (categoryId === "everyone") {
    return items;
  }

  return items.filter((item) => item.categoryId === categoryId);
}

export function filterPeopleBySearch(
  items: PeopleCarouselItem[],
  query: string,
) {
  const normalizedQuery = extractHangulSyllables(query);

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => personNameMatchesQuery(item.name, query));
}

export function getVisiblePeople(
  items: PeopleCarouselItem[],
  categoryId: PeopleCategoryId,
  query: string,
) {
  const roster = extractHangulSyllables(query)
    ? items
    : filterPeopleByCategory(items, categoryId);

  return filterPeopleBySearch(roster, query);
}
