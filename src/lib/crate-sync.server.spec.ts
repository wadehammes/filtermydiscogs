import { describe, expect, it } from "@jest/globals";
import {
  computeCrateSyncDeletionPercentage,
  resolveOrphanedInstanceIds,
} from "src/lib/crate-sync.server";

describe("crateSyncServer", () => {
  it("resolveOrphanedInstanceIds excludes collection instance ids", () => {
    const collection = new Set(["1", "2", "10"]);
    expect(
      resolveOrphanedInstanceIds(
        [{ instance_id: "1" }, { instance_id: "3" }, { instance_id: "10" }],
        collection,
      ),
    ).toEqual(["3"]);
  });

  it("computeCrateSyncDeletionPercentage uses row counts", () => {
    expect(
      computeCrateSyncDeletionPercentage({
        totalRowCount: 100,
        orphanedRowCount: 51,
      }),
    ).toBe(51);
    expect(
      computeCrateSyncDeletionPercentage({
        totalRowCount: 0,
        orphanedRowCount: 0,
      }),
    ).toBe(0);
  });
});
