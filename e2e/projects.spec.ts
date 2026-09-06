import { expect, test } from "@playwright/test";
import { getProjectDetailPath, SITE_PATHS } from "../app/utils/routes";

async function selectToggle(page: import("@playwright/test").Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });

  await expect(async () => {
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
  }).toPass();
}

test("project category, grid view, and detail state persist", async ({ page }) => {
  await page.goto(SITE_PATHS.projects);

  await selectToggle(page, "Healthcare");
  await selectToggle(page, "Grid view");

  const grid = page.getByRole("region", { name: "Project grid" });
  await expect(grid.getByRole("button")).toHaveCount(7);

  await grid.getByRole("button", { name: "Open Hand Grip" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hand Grip" })).toBeVisible();

  await page.getByRole("button", { name: "Close project" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Healthcare", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Grid view" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("project thumbnail links to member profiles and back to the work", async ({
  page,
}) => {
  await page.goto(getProjectDetailPath(1));

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("link", { name: "공건호 Profile" })).toBeVisible();
  await expect(page.getByRole("link", { name: "이채원 Profile" })).toBeVisible();

  await page.getByRole("link", { name: "공건호 Profile" }).click();
  await expect(page).toHaveURL(/\/peoplepage\/01\/?$/);
  await expect(page.getByRole("dialog", { name: "공건호" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ICY:CLE Project" })).toBeVisible();

  await page.getByRole("link", { name: "ICY:CLE Project" }).click();
  await expect(page).toHaveURL(new RegExp(`${getProjectDetailPath(1)}/?$`));
  await expect(page.getByRole("heading", { name: "ICY:CLE" })).toBeVisible();
});

test("opening a grid card does not move the document scroll", async ({ page }) => {
  await page.goto(SITE_PATHS.projects);
  await selectToggle(page, "Grid view");

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Open ICY:CLE" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
