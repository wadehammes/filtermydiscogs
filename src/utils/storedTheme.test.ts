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
    expect(isValidStoredTheme("dark")).toBe(true);
    expect(parseStoredTheme("dark")).toBe("dark");
  });

  it("rejects system and unknown values", () => {
    expect(isValidStoredTheme("system")).toBe(false);
    expect(parseStoredTheme("system", "light")).toBe("light");
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
