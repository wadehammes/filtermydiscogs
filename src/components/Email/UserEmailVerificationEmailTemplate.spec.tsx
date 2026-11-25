import { beforeEach, describe, expect, it } from "@jest/globals";
import { UserEmailVerificationEmailTemplatePO } from "src/components/Email/UserEmailVerificationEmailTemplate.po";
import { emailContactCopy } from "src/constants/emailCopy.constants";
import { userEmailVerificationCopy } from "src/constants/userEmailVerificationCopy.constants";
import { screen } from "test-utils";

let po: UserEmailVerificationEmailTemplatePO;

describe("UserEmailVerificationEmailTemplate", () => {
  beforeEach(() => {
    po = new UserEmailVerificationEmailTemplatePO();
  });

  it("renders branded verification copy with a confirm link", () => {
    po.renderUserEmailVerificationEmail();

    expect(po.documentText()).toContain(userEmailVerificationCopy.body);
    expect(po.documentText()).toContain(userEmailVerificationCopy.expiryNote);
    expect(po.documentText()).toContain(userEmailVerificationCopy.ignoreNote);
    expect(
      screen.getByRole("link", { name: userEmailVerificationCopy.ctaVerify }),
    ).toHaveAttribute(
      "href",
      "https://www.filtermydisco.gs/api/user/email-verification/confirm?token=test",
    );
    expect(screen.getByRole("link", { name: "Account settings" })).toHaveAttribute(
      "href",
      "https://www.filtermydisco.gs/settings?section=account",
    );
    expect(screen.getByTestId("email-img")).toHaveAttribute(
      "data-src",
      "https://www.filtermydisco.gs/email-icon.png",
    );
  });

  it("shows a mailto contact line when contactEmail is set", () => {
    po.renderUserEmailVerificationEmail("noise@filtermydisco.gs");

    expect(po.documentText()).toContain(emailContactCopy.contactLead);
    expect(
      screen.getByRole("link", { name: "noise@filtermydisco.gs" }),
    ).toHaveAttribute("href", "mailto:noise@filtermydisco.gs");
  });
});