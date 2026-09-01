import { SITE_PATHS } from "./routes";

export const SITE_NAV_ITEMS = [
  { label: "Projects", href: SITE_PATHS.projects },
  { label: "People", href: SITE_PATHS.people },
  { label: "Showroom", href: SITE_PATHS.showroom },
  { label: "Credits", href: SITE_PATHS.credits },
] as const;

export type SiteNavItem = (typeof SITE_NAV_ITEMS)[number];
