import { describe, expect, it } from "@jest/globals";
import {
  defaultViewState,
  isValidViewState,
  parseViewStateJson,
} from "src/types/view.types";
import { isValidStoredTheme, parseStoredTheme } from "./storedTheme";

describe("storedTheme", () => {
  it("accepts light and dark", () => {
    expect(isValidStoredTheme("light")).toBe(true);
    expect(isValidStoredTheme("dim")).toBe(true);
    expect(isValidStoredTheme("dark")).toBe(true);
    expect(isValidStoredTheme("sepia")).toBe(true);
    expect(isValidStoredTheme("high-contrast")).toBe(true);
    expect(isValidStoredTheme("system")).toBe(true);
    expect(parseStoredTheme("midnight")).toBe("midnight");
  });

  it("rejects unknown values", () => {
    expect(isValidStoredTheme("table")).toBe(false);
    expect(parseStoredTheme("table", "light")).toBe("light");
  });
});

describe("view.types", () => {
  it("parses valid stored view state", () => {
    const stored = JSON.stringify({
      currentView: "list",
      previousView: "card",
    });

    expect(parseViewStateJson(stored)).toEqual({
      currentView: "list",
      previousView: "card",
    });
  });

  it("rejects invalid view modes", () => {
    expect(
      isValidViewState({
        currentView: "table",
        previousView: "card",
      }),
    ).toBe(false);
    expect(
      parseViewStateJson(JSON.stringify({ currentView: "table" })),
    ).toEqual(defaultViewState);
  });
});
