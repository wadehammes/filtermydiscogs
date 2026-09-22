import { expect, test } from "./fixtures/msw.fixture";

test.describe("authenticated releases (MSW)", () => {
  test("renders releases workspace after collection loads", async ({
    page,
  }) => {
    await page.goto("/releases");

    await expect(page).toHaveURL(/\/releases/);
    await expect(page.getByTestId("fmdLogin")).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "App" }).getByRole("link", {
        name: "Releases",
      }),
    ).toBeVisible();
    await expect(page.getByText("Showing 3 releases")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("group", { name: "Collection view mode" }),
    ).toBeVisible();
    await expect(page.getByTestId("fmdReleaseCard")).toHaveCount(3);
    await expect(page.getByText("E2E Album One")).toBeVisible();
    await expect(page.getByText("E2E Album Two")).toBeVisible();
    await expect(page.getByText("E2E Album Three")).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Select crate" }),
    ).toBeVisible();
  });
});
