export const SITE_PATHS = {
  landing: "/",
  projects: "/projectspage",
  people: "/peoplepage",
  showroom: "/showroompage",
  credits: "/creditspage",
} as const;

export function isExactOrNestedPath(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function isLandingPath(pathname: string) {
  return pathname === SITE_PATHS.landing;
}

export function isShowroomPath(pathname: string) {
  return isExactOrNestedPath(pathname, SITE_PATHS.showroom);
}

export function isPeoplePath(pathname: string) {
  return isExactOrNestedPath(pathname, SITE_PATHS.people);
}

export function isProjectDetailPath(pathname: string) {
  return (
    pathname.startsWith(`${SITE_PATHS.projects}/`) &&
    pathname !== `${SITE_PATHS.projects}/`
  );
}

export function getProjectDetailPath(id: number) {
  return `${SITE_PATHS.projects}/${String(id).padStart(2, "0")}`;
}

export function getMemberDetailPath(index: number) {
  return `${SITE_PATHS.people}/${String(index + 1).padStart(2, "0")}`;
}
