import { beforeEach, describe, expect, it } from "@jest/globals";
import { BugReportSupportEmailTemplatePO } from "src/components/Email/BugReportSupportEmailTemplate.po";
import { bugReportSupportEmailCopy } from "src/constants/bugReportEmailCopy.constants";

describe("BugReportSupportEmailTemplate", () => {
  let po: BugReportSupportEmailTemplatePO;

  beforeEach(() => {
    po = new BugReportSupportEmailTemplatePO();
  });

  it("renders support inbox copy with shared email chrome", () => {
    po.renderBugReportSupportEmail({
      message: "Palette preview count looks wrong",
      username: "wax-head",
      reporterEmail: "wax@example.com",
    });

    expect(po.documentText()).toContain(
      `${bugReportSupportEmailCopy.discogsUserLabel}: wax-head`,
    );
    expect(po.documentText()).toContain(
      `${bugReportSupportEmailCopy.replyToLabel}: wax@example.com`,
    );
    expect(po.documentText()).toContain("Palette preview count looks wrong");
  });
});
