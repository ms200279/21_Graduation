export function getMemberSlugFromIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function getMemberPathFromIndex(index: number) {
  return `/peoplepage/${getMemberSlugFromIndex(index)}`;
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
