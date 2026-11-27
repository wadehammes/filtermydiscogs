import { describe, expect, it, jest } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import { addCollectionCommandReleasesToCrate } from "src/utils/collectionCommandCrateFromPreview";

describe("addCollectionCommandReleasesToCrate", () => {
  it("when add succeeds for each release, returns the full count", async () => {
    const addReleaseToCrate = jest
      .fn<
        (
          crateId: string,
          release: DiscogsRelease,
        ) => Promise<{ success: boolean }>
      >()
      .mockResolvedValue({ success: true });
    const releases = releaseFactory.buildList(2);

    const addedCount = await addCollectionCommandReleasesToCrate({
      crateId: "crate-1",
      releases,
      addReleaseToCrate,
    });

    expect(addedCount).toBe(2);
    expect(addReleaseToCrate).toHaveBeenCalledTimes(2);
  });

  it("when a release is already in the crate, skips it and continues", async () => {
    const release = releaseFactory.build();
    const addReleaseToCrate = jest
      .fn<
        (
          crateId: string,
          release: DiscogsRelease,
        ) => Promise<{ success: boolean }>
      >()
      .mockRejectedValueOnce(new Error("HTTP error! status: 409"))
      .mockResolvedValueOnce({ success: true });

    const addedCount = await addCollectionCommandReleasesToCrate({
      crateId: "crate-1",
      releases: [releaseFactory.build(), release],
      addReleaseToCrate,
    });

    expect(addedCount).toBe(1);
  });
});
