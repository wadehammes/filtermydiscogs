import { describe, expect, it } from "@jest/globals";
import {
  buildCollectionCommandOpenAriaLabel,
  buildCollectionCommandOpenTooltip,
} from "src/utils/buildCollectionCommandOpenTooltip";

describe("buildCollectionCommandOpenTooltip", () => {
  it("includes the shortcut abbreviation in the tooltip copy", () => {
    expect(buildCollectionCommandOpenTooltip("mod+shift+k")).toMatch(
      /plain English \(.+SFT.+K\)/,
    );
  });

  it("prefixes the aria label with open collection command", () => {
    expect(buildCollectionCommandOpenAriaLabel("mod+shift+k")).toMatch(
      /^Open collection command\./,
    );
  });
});
