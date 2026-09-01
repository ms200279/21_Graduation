import { expect, test } from "@playwright/test";
import {
  getMemberDetailPath,
  getProjectDetailPath,
  SITE_PATHS,
} from "../app/utils/routes";

const ROUTES = [
  SITE_PATHS.landing,
  SITE_PATHS.projects,
  getProjectDetailPath(1),
  SITE_PATHS.people,
  getMemberDetailPath(0),
  SITE_PATHS.showroom,
  SITE_PATHS.credits,
] as const;

for (const route of ROUTES) {
  test(`${route} loads without runtime errors`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    const response = await page.goto(route);

    expect(response?.ok()).toBe(true);
    await expect(page.locator("body")).toBeVisible();
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
