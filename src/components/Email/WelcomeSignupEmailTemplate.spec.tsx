import { beforeEach, describe, expect, it } from "@jest/globals";
import { WelcomeSignupEmailTemplatePO } from "src/components/Email/WelcomeSignupEmailTemplate.po";
import { emailContactCopy } from "src/constants/emailCopy.constants";
import { welcomeSignupEmailCopy } from "src/constants/welcomeSignupEmailCopy.constants";
import { screen } from "test-utils";

describe("WelcomeSignupEmailTemplate", () => {
  let po: WelcomeSignupEmailTemplatePO;

  beforeEach(() => {
    po = new WelcomeSignupEmailTemplatePO();
  });

  it("renders branded welcome copy with collection and settings links", () => {
    po.renderWelcomeSignupEmail("crate-digger");

    expect(po.documentText()).toContain(
      welcomeSignupEmailCopy.greeting("crate-digger"),
    );
    expect(po.documentText()).toContain(welcomeSignupEmailCopy.body);
    expect(po.documentText()).toContain(welcomeSignupEmailCopy.syncNote);
    expect(po.documentText()).toContain(welcomeSignupEmailCopy.ctaCollection);
    expect(po.documentText()).toContain(welcomeSignupEmailCopy.settingsNote);
    expect(po.documentText()).toContain(welcomeSignupEmailCopy.donateLinkLabel);
    expect(
      screen.getByRole("link", { name: "Open Collection" }),
    ).toHaveAttribute("href", "https://www.filtermydisco.gs/collection");
    expect(
      screen.getByRole("link", { name: "One-time donations" }),
    ).toHaveAttribute("href", "https://www.filtermydisco.gs/about#support");
    expect(screen.getByTestId("email-img")).toHaveAttribute(
      "data-src",
      "https://www.filtermydisco.gs/email-icon.png",
    );
  });

  it("shows a mailto contact line when contactEmail is set", () => {
    po.renderWelcomeSignupEmail("crate-digger", "noise@filtermydisco.gs");

    expect(po.documentText()).toContain(emailContactCopy.contactLead);
    expect(
      screen.getByRole("link", { name: "noise@filtermydisco.gs" }),
    ).toHaveAttribute("href", "mailto:noise@filtermydisco.gs");
  });
});
