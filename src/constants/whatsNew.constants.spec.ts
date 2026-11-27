import { describe, expect, it } from "@jest/globals";
import {
  resolveWhatsNewBulletText,
  WHATS_NEW_SHORTCUT_PLACEHOLDER,
} from "src/constants/whatsNew.constants";

describe("resolveWhatsNewBulletText", () => {
  it("leaves plain text unchanged", () => {
    expect(
      resolveWhatsNewBulletText(
        { id: "x", badge: "new", text: "Export a mosaic." },
        "⌘⇧K",
      ),
    ).toBe("Export a mosaic.");
  });

  it("replaces the shortcut placeholder", () => {
    expect(
      resolveWhatsNewBulletText(
        {
          id: "y",
          badge: "new",
          text: `Open the palette (${WHATS_NEW_SHORTCUT_PLACEHOLDER}).`,
        },
        "⌘⇧K",
      ),
    ).toBe("Open the palette (⌘⇧K).");
  });
});
