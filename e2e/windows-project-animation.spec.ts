import { expect, test } from "@playwright/test";

import { SITE_PATHS } from "../app/utils/routes";

const WINDOWS_CHROME_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";

test.use({ userAgent: WINDOWS_CHROME_USER_AGENT });

test("project detail panel enters and exits on Windows desktop", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Windows desktop regression");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(SITE_PATHS.projects);

  const gridView = page.getByRole("button", { name: "Grid view" });
  await expect(async () => {
    await gridView.click();
    await expect(gridView).toHaveAttribute("aria-pressed", "true");
  }).toPass();

  await page.getByRole("button", { name: "Open ICY:CLE" }).click();

  const layer = page.getByRole("dialog");
  const panel = layer.locator(".project-detail-panel");
  await expect(layer).toHaveClass(/project-detail-layer--open/);
  await expect
    .poll(() =>
      panel.evaluate((node) =>
        node
          .getAnimations()
          .some((animation) => animation.playState === "running"),
      ),
    )
    .toBe(true);

  await expect.poll(() => panel.evaluate((node) => node.getAnimations().length)).toBe(0);
  await page.getByRole("button", { name: "Close project" }).click();

  await expect(layer).toHaveClass(/project-detail-layer--closing/);
  await expect
    .poll(() =>
      panel.evaluate((node) =>
        node
          .getAnimations()
          .some((animation) => animation.playState === "running"),
      ),
    )
    .toBe(true);
  await expect(layer).toBeHidden();
});
