import { describe, expect, it } from "@jest/globals";
import { rankMostCratedInstances } from "src/lib/dashboard-most-crated.server";

describe("rankMostCratedInstances", () => {
  it("counts distinct crates per instance and keeps only multi-crate rows", () => {
    const ranked = rankMostCratedInstances(
      [
        { instance_id: "a", crate_id: "c1" },
        { instance_id: "a", crate_id: "c2" },
        { instance_id: "b", crate_id: "c1" },
        { instance_id: "c", crate_id: "c1" },
        { instance_id: "c", crate_id: "c2" },
        { instance_id: "c", crate_id: "c3" },
      ],
      10,
    );

    expect(ranked).toEqual([
      { instance_id: "c", crate_count: 3 },
      { instance_id: "a", crate_count: 2 },
    ]);
  });

  it("respects the limit", () => {
    const pairs = [
      { instance_id: "1", crate_id: "a" },
      { instance_id: "1", crate_id: "b" },
      { instance_id: "2", crate_id: "a" },
      { instance_id: "2", crate_id: "b" },
      { instance_id: "3", crate_id: "a" },
      { instance_id: "3", crate_id: "b" },
    ];
    expect(rankMostCratedInstances(pairs, 1)).toHaveLength(1);
  });
});
