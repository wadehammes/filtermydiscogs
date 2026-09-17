import { describe, expect, it } from "@jest/globals";
import { resolveCrateDrawerDeletePolicy } from "src/utils/crateDrawerDeletePolicy";

describe("resolveCrateDrawerDeletePolicy", () => {
  it("blocks delete when only one crate remains", () => {
    expect(
      resolveCrateDrawerDeletePolicy({ crateCount: 1, isDefaultCrate: false }),
    ).toEqual({
      canDelete: false,
      deleteBlockedReason: "You need at least one crate.",
    });
  });

  it("blocks delete for the default crate when others exist", () => {
    expect(
      resolveCrateDrawerDeletePolicy({ crateCount: 3, isDefaultCrate: true }),
    ).toEqual({
      canDelete: false,
      deleteBlockedReason: "Set another crate as default first.",
    });
  });

  it("allows delete for a non-default crate when multiple crates exist", () => {
    expect(
      resolveCrateDrawerDeletePolicy({ crateCount: 2, isDefaultCrate: false }),
    ).toEqual({
      canDelete: true,
      deleteBlockedReason: null,
    });
  });
});
