import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
} from "src/tests/msw/e2eSession.constants";
import { expect, test } from "./fixtures/publicMsw.fixture";
import { expectNotOnLogin } from "./helpers/authenticatedExpectations";
import { gotoPublicDemoCrate } from "./helpers/publicCrate";

test.describe("public shared crate (MSW)", () => {
  test("loads the demo public crate without login", async ({ page }) => {
    await gotoPublicDemoCrate(page);
    await expect(page.getByTestId("fmdPublicCrate")).toBeVisible();
    await expectNotOnLogin(page);
    await expect(
      page.getByRole("button", {
        name: `Open release details for ${E2E_ALBUM_ONE}`,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: `Open release details for ${E2E_ALBUM_TWO}`,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: `Open release details for ${E2E_ALBUM_THREE}`,
      }),
    ).toBeVisible();
  });
});
