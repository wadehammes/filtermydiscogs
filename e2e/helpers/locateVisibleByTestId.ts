import type { Locator, Page } from "@playwright/test";

export const locateVisibleByTestId = (page: Page, testId: string): Locator =>
  page.locator(`[data-testid="${testId}"]:visible`);
