import { expect, test } from "./fixtures/msw.fixture";
import { expectNotOnLogin } from "./helpers/authenticatedExpectations";

test.describe("authenticated settings (MSW)", () => {
  test("loads the settings workspace and toggles a playback preference", async ({
    page,
  }) => {
    await page.goto("/settings?section=playback");

    await expect(page).toHaveURL(/\/settings/);
    await expectNotOnLogin(page);
    await expect(
      page.getByRole("heading", { level: 1, name: "Settings" }),
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      page.getByRole("heading", { level: 2, name: "Playback" }),
    ).toBeVisible();

    const autoPlayToggle = page.getByRole("checkbox", {
      name: "Play immediately when adding to an empty queue",
    });
    await expect(autoPlayToggle).toBeChecked();
    await autoPlayToggle.click();
    await expect(autoPlayToggle).not.toBeChecked();
    await expect(
      page.getByRole("status", { name: "Preferences saved" }),
    ).toBeVisible({
      timeout: 15_000,
    });
  });
});
