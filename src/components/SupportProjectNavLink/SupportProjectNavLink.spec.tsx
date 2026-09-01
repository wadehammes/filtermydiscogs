import { beforeEach, describe, expect, it } from "@jest/globals";
import { SupportProjectNavLinkPageObject } from "src/components/SupportProjectNavLink/SupportProjectNavLink.po";
import { screen } from "test-utils";

let po: SupportProjectNavLinkPageObject;

describe("SupportProjectNavLink", () => {
  beforeEach(() => {
    po = new SupportProjectNavLinkPageObject();
  });

  it("links to the about support section", () => {
    po.renderSupportProjectNavLink({ children: "Support" });

    expect(
      screen.getByRole("link", { name: "Support the project" }),
    ).toHaveAttribute("href", "/about#support");
  });
});
