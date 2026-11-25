import { describe, expect, it } from "@jest/globals";
import {
  emailFooterContactLink,
  parseEmailMailbox,
} from "src/utils/emailMailbox";

describe("parseEmailMailbox", () => {
  it("parses a plain address", () => {
    expect(parseEmailMailbox("noise@filtermydisco.gs")).toEqual({
      address: "noise@filtermydisco.gs",
    });
  });

  it("parses a display name and address", () => {
    expect(
      parseEmailMailbox("FilterMyDisco.gs <noise@filtermydisco.gs>"),
    ).toEqual({
      displayName: "FilterMyDisco.gs",
      address: "noise@filtermydisco.gs",
    });
  });

  it("parses a quoted display name", () => {
    expect(
      parseEmailMailbox('"FilterMyDisco.gs" <noise@filtermydisco.gs>'),
    ).toEqual({
      displayName: "FilterMyDisco.gs",
      address: "noise@filtermydisco.gs",
    });
  });
});

describe("emailFooterContactLink", () => {
  it("uses the display name for link text when a mailbox is set", () => {
    expect(
      emailFooterContactLink("FilterMyDisco.gs <noise@filtermydisco.gs>"),
    ).toEqual({
      href: "mailto:noise@filtermydisco.gs",
      label: "FilterMyDisco.gs",
    });
  });

  it("uses the address when no display name is present", () => {
    expect(emailFooterContactLink("noise@filtermydisco.gs")).toEqual({
      href: "mailto:noise@filtermydisco.gs",
      label: "noise@filtermydisco.gs",
    });
  });
});
