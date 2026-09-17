import { describe, expect, it } from "@jest/globals";
import { buildReleaseCrateMenuMemberIds } from "src/utils/releaseCrateMenuMemberIds";

describe("buildReleaseCrateMenuMemberIds", () => {
  it("merges membership crate ids with the active crate when the release is staged", () => {
    expect(
      buildReleaseCrateMenuMemberIds({
        membershipCrateIds: ["crate-a"],
        activeCrateId: "crate-b",
        activeCrateInstanceIds: new Set(["42"]),
        instanceId: "42",
      }),
    ).toEqual(new Set(["crate-a", "crate-b"]));
  });

  it("does not add the active crate when the release is not in the active crate set", () => {
    expect(
      buildReleaseCrateMenuMemberIds({
        membershipCrateIds: ["crate-a"],
        activeCrateId: "crate-b",
        activeCrateInstanceIds: new Set(["99"]),
        instanceId: "42",
      }),
    ).toEqual(new Set(["crate-a"]));
  });
});
