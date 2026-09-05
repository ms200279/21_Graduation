import { expect, test } from "@playwright/test";

import { getMemberDetailPath, SITE_PATHS } from "../app/utils/routes";

test("landing responds to scroll input", async ({ page }) => {
  await page.goto(SITE_PATHS.landing);
  await expect(page.locator("body")).toHaveClass(/landing-fullpage-active/);

  const scrollContainer = page.locator(".landing-fullpage");
  await scrollContainer.hover();
  await page.mouse.wheel(0, 800);

  await expect.poll(() => scrollContainer.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
});

test("people card opens and closes without leaving carousel state", async ({
  page,
}) => {
  await page.goto(SITE_PATHS.people);

  const expandButton = page.getByRole("button", { name: "Expand 공건호" });
  await expect(expandButton).toBeVisible({ timeout: 10_000 });
  await expandButton.hover();
  await expandButton.click();

  await expect(page).toHaveURL(new RegExp(`${getMemberDetailPath(0)}$`));
  await expect(page.getByRole("dialog", { name: "공건호" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(new RegExp(`${SITE_PATHS.people}$`));
  await expect(page.getByRole("dialog", { name: "공건호" })).toBeHidden();
});

test("showroom accepts text input and announces the rendered value", async ({
  page,
}) => {
  await page.goto(SITE_PATHS.showroom);

  const input = page.getByLabel("Particle text");
  await input.fill("해파리");
  await input.press("Enter");

  await expect(page.getByText("해파리", { exact: true }).first()).toBeVisible();
});

test("credit detail closes back to the persistent scene", async ({ page }) => {
  await page.goto(`${SITE_PATHS.credits}/committee`);

  await expect(page.getByRole("button", { name: "Back to all credits" })).toBeVisible();
  await page.getByRole("button", { name: "Back to all credits" }).click();

  await expect(page).toHaveURL(new RegExp(`${SITE_PATHS.credits}$`));
  await expect(page.locator("canvas")).toBeVisible();
});
