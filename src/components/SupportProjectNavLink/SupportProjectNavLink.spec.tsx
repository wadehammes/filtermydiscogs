import { beforeEach, describe, expect, it } from "@jest/globals";
import { SupportProjectNavLinkPageObject } from "src/components/SupportProjectNavLink/SupportProjectNavLink.po";
import { SUPPORT_PROJECT_NAV_LABEL } from "src/constants/supportProjectToast.constants";
import { screen } from "test-utils";

let po: SupportProjectNavLinkPageObject;

describe("SupportProjectNavLink", () => {
  beforeEach(() => {
    po = new SupportProjectNavLinkPageObject();
  });

  it("links to the about support section", () => {
    po.renderSupportProjectNavLink({ children: SUPPORT_PROJECT_NAV_LABEL });

    expect(
      screen.getByRole("link", { name: SUPPORT_PROJECT_NAV_LABEL }),
    ).toHaveAttribute("href", "/about#support");
  });
});
