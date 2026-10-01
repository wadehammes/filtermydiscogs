import { expect, type Page } from "@playwright/test";

export const E2E_NEW_CRATE_NAME = "E2E Shelf Crate";

export const submitCreateCrateDialog = async (
  page: Page,
  crateName: string = E2E_NEW_CRATE_NAME,
) => {
  const dialog = page.getByRole("dialog", { name: "Add to new crate" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "Crate name" }).fill(crateName);
  await dialog.getByRole("button", { name: "Create crate" }).click();
  await expect(dialog).toHaveCount(0);
};
