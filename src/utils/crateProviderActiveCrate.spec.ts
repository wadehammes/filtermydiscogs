import { describe, expect, it } from "@jest/globals";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { resolveActiveCrateId } from "src/utils/crateProviderActiveCrate";

describe("crateProviderActiveCrate", () => {
  it("keeps the current active crate when it still exists", () => {
    const crates = [
      crateFactory.build({ id: "a", is_default: true }),
      crateFactory.build({ id: "b" }),
    ];

    expect(resolveActiveCrateId({ crates, activeCrateId: "b" })).toBe("b");
  });

  it("falls back to the default crate when active is missing", () => {
    const crates = [
      crateFactory.build({ id: "a", is_default: true }),
      crateFactory.build({ id: "b" }),
    ];

    expect(resolveActiveCrateId({ crates, activeCrateId: "missing" })).toBe(
      "a",
    );
  });

  it("returns null when there are no crates", () => {
    expect(resolveActiveCrateId({ crates: [], activeCrateId: "a" })).toBeNull();
  });
});
