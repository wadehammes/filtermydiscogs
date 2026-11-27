import { beforeEach, describe, expect, it } from "@jest/globals";
import { BugReportReceivedEmailTemplatePO } from "src/components/Email/BugReportReceivedEmailTemplate.po";
import { bugReportReceivedEmailCopy } from "src/constants/bugReportEmailCopy.constants";
import { emailContactCopy } from "src/constants/emailCopy.constants";
import { screen } from "test-utils";

describe("BugReportReceivedEmailTemplate", () => {
  let po: BugReportReceivedEmailTemplatePO;

  beforeEach(() => {
    po = new BugReportReceivedEmailTemplatePO();
  });

  it("renders receipt copy with shared email chrome", () => {
    po.renderBugReportReceivedEmail("crate-digger");

    expect(po.documentText()).toContain(
      bugReportReceivedEmailCopy.greeting("crate-digger"),
    );
    expect(po.documentText()).toContain(bugReportReceivedEmailCopy.body);
    expect(po.documentText()).toContain(bugReportReceivedEmailCopy.footnote);
    expect(screen.getByTestId("email-img")).toHaveAttribute(
      "data-src",
      "https://www.filtermydisco.gs/email-icon.png",
    );
  });

  it("shows a mailto contact line when contactEmail is set", () => {
    po.renderBugReportReceivedEmail("crate-digger", "noise@filtermydisco.gs");

    expect(po.documentText()).toContain(emailContactCopy.contactLead);
    expect(
      screen.getByRole("link", { name: "noise@filtermydisco.gs" }),
    ).toHaveAttribute("href", "mailto:noise@filtermydisco.gs");
  });
});
