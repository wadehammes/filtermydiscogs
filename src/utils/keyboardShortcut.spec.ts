import { describe, expect, it, jest } from "@jest/globals";
import {
  eventMatchesShortcut,
  formatShortcutChipAbbreviation,
  formatShortcutForDisplay,
  normalizeKeyboardShortcut,
  parseKeyboardShortcut,
} from "src/utils/keyboardShortcut";

describe("keyboardShortcut", () => {
  it("normalizes and parses shortcut strings", () => {
    expect(normalizeKeyboardShortcut(["Mod", "Shift", "K"])).toBe(
      "mod+shift+k",
    );
    expect(parseKeyboardShortcut("mod+shift+k")).toEqual(["mod", "shift", "k"]);
  });

  it("matches keyboard events against mod+shift+k", () => {
    const event = {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      shiftKey: true,
      altKey: false,
    } as KeyboardEvent;

    expect(eventMatchesShortcut(event, "mod+shift+k")).toBe(true);
    expect(eventMatchesShortcut(event, "mod+k")).toBe(false);
  });

  it("formats shortcut for display", () => {
    expect(formatShortcutForDisplay("mod+shift+k").length).toBeGreaterThan(0);
  });

  it("formatShortcutChipAbbreviation uses CMD on Mac and CTRL on PC", () => {
    const platformSpy = jest.spyOn(navigator, "platform", "get");

    platformSpy.mockReturnValue("MacIntel");
    expect(formatShortcutChipAbbreviation("mod+shift+k")).toBe("CMD+SFT+K");

    platformSpy.mockReturnValue("Win32");
    expect(formatShortcutChipAbbreviation("mod+shift+k")).toBe("CTRL+SFT+K");

    platformSpy.mockRestore();
  });
});
