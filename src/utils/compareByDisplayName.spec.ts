import { describe, expect, it } from "@jest/globals";
import {
  compareByDisplayName,
  sortByDisplayName,
} from "./compareByDisplayName";

describe("compareByDisplayName", () => {
  it("sorts strings case-insensitively", () => {
    expect(compareByDisplayName("Beta", "alpha")).toBeGreaterThan(0);
    expect(compareByDisplayName("alpha", "Beta")).toBeLessThan(0);
  });

  it("sortByDisplayName orders items by name", () => {
    const items = [{ name: "Zulu" }, { name: "alpha" }, { name: "Mike" }];

    expect(
      sortByDisplayName(items, (item) => item.name).map((item) => item.name),
    ).toEqual(["alpha", "Mike", "Zulu"]);
  });
});
