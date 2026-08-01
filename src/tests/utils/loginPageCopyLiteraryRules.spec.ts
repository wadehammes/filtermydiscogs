import { describe, expect, it } from "@jest/globals";
import {
  getLoginPageCopyEntries,
  LOGIN_PAGE_COPY_SOURCE_FILES,
} from "src/constants/loginPageCopy.registry";
import { SITE_NAME } from "src/constants/siteMetadata";
import {
  formatLoginPageCopyViolations,
  validateLoginPageCopyEntries,
  validateLoginPageCopyText,
} from "src/tests/utils/loginPageCopyLiteraryRules";

describe("loginPageCopyLiteraryRules", () => {
  it("flags em dashes, banned phrases, and embellishment in text checks", () => {
    expect(
      validateLoginPageCopyText("Share public crates—with notes."),
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: "em-dash" })]),
    );

    expect(
      validateLoginPageCopyText("Notes appear on public crate pages when set."),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: "banned-phrase" }),
      ]),
    );

    expect(
      validateLoginPageCopyText("Celebrate your collection with us."),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: "embellishment" }),
      ]),
    );
  });

  it("keeps the login page copy registry free of literary violations", () => {
    const violations = validateLoginPageCopyEntries(
      getLoginPageCopyEntries(SITE_NAME),
    );

    expect(violations).toEqual([]);
  });

  it("documents the files covered by login page copy drift checks", () => {
    expect(LOGIN_PAGE_COPY_SOURCE_FILES).toEqual(
      expect.arrayContaining([
        "src/constants/loginPageCopy.registry.ts",
        "src/components/Login/loginFeatures.constants.ts",
      ]),
    );
  });

  it("formats violations for hook and CI output", () => {
    const formatted = formatLoginPageCopyViolations([
      {
        entryId: "site.lead",
        rule: "em-dash",
        message: "site.lead: Em dashes are not allowed in login page copy.",
      },
    ]);

    expect(formatted).toContain("[em-dash]");
    expect(formatted).toContain("site.lead");
  });
});
