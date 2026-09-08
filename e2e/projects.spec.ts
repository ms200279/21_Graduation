import { expect, test, type Page } from "@playwright/test";
import { getProjectDetailPath, SITE_PATHS } from "../app/utils/routes";

function isMobileViewport(page: Page) {
  return (page.viewportSize()?.width ?? 1280) < 768;
}

async function selectToggle(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });

  await expect(async () => {
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
  }).toPass();
}

async function openGridProject(page: Page, name: string) {
  const card = page.getByRole("button", { name });
  await card.click();

  if (isMobileViewport(page)) {
    await expect(card).toHaveAttribute("aria-expanded", "true");
    await card.click();
  }
}

test("project category, grid view, and detail state persist", async ({ page }) => {
  await page.goto(SITE_PATHS.projects);

  await selectToggle(page, "Healthcare");
  await selectToggle(page, "Grid view");

  const grid = page.getByRole("region", { name: "Project grid" });
  await expect(grid.getByRole("button")).toHaveCount(7);

  await openGridProject(page, "Open Hand Grip");
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
  await openGridProject(page, "Open ICY:CLE");

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("mobile project gallery pages horizontally and previews grid cards", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile-chromium",
    "Mobile gallery gestures are covered on the Pixel viewport",
  );

  await page.goto(SITE_PATHS.projects);

  const row = page.getByRole("region", { name: "Upper project carousel row" });
  const track = row.locator(".projects-cylinder-row__track");
  const startTransform = await track.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  const box = await row.boundingBox();

  expect(box).not.toBeNull();

  await page.mouse.move(box!.x + box!.width * 0.72, box!.y + box!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width * 0.28,
    box!.y + box!.height * 0.5,
    { steps: 10 },
  );
  await page.mouse.up();

  await expect
    .poll(async () =>
      track.evaluate((element) => getComputedStyle(element).transform),
    )
    .not.toBe(startTransform);

  await selectToggle(page, "Grid view");

  const grid = page.getByRole("region", { name: "Project grid" });
  const card = grid.getByRole("button", { name: "Open ICY:CLE" });
  await card.click();
  await expect(card).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await card.click();
  await expect(page.getByRole("dialog")).toBeVisible();

  const scroll = page.locator(".project-detail-scroll");
  await expect(scroll).toHaveCSS("scroll-snap-type", /y/);

  await scroll.evaluate((element) => {
    element.scrollTo({ top: element.clientHeight, behavior: "instant" });
  });

  await expect(
    page.locator(".project-detail-progress__bar").nth(1),
  ).toHaveClass(/project-detail-progress__bar--active/);
});

