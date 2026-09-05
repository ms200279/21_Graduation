import { getMemberDetailPath } from "@/app/utils/routes";

export function getMemberSlugFromIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function getMemberPathFromIndex(index: number) {
  return getMemberDetailPath(index);
}

export function parseMemberSlugFromPath(pathname: string) {
  const match = pathname.match(/^\/peoplepage\/([^/]+)\/?$/);

  return match?.[1] ?? null;
}

export function findMemberIndexBySlug(
  itemCount: number,
  slug: string,
) {
  const normalized = slug.padStart(2, "0");
  const numericSlug = Number.parseInt(slug, 10);

  if (Number.isNaN(numericSlug) || numericSlug < 1 || numericSlug > itemCount) {
    const indexFromPadded = Number.parseInt(normalized, 10) - 1;

    if (indexFromPadded >= 0 && indexFromPadded < itemCount) {
      return indexFromPadded;
    }

    return -1;
  }

  return numericSlug - 1;
}

export function findMemberIndexByItemId(
  items: Array<{ id: string }>,
  slug: string,
) {
  const numericSlug = Number.parseInt(slug, 10);

  if (Number.isNaN(numericSlug)) {
    return -1;
  }

  return items.findIndex(
    (item) => Number.parseInt(item.id, 10) === numericSlug,
  );
}

export function getMemberRosterIndex(item: { id: string }) {
  return Number.parseInt(item.id, 10) - 1;
}
