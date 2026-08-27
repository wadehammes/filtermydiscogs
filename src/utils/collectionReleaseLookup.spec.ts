import { describe, expect, it } from "@jest/globals";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  findCollectionReleaseByInstanceId,
  patchCollectionPagesReleaseByInstanceId,
} from "src/utils/collectionReleaseLookup";

describe("collectionReleaseLookup", () => {
  it("finds a release by instance id across collection pages", () => {
    const target = releaseFactory.build({ instance_id: "instance-b" });
    const pages = [
      collectionFactory.build(
        { releases: [releaseFactory.build({ instance_id: "instance-a" })] },
        { page: 1, totalPages: 2, releaseCount: 2 },
      ),
      collectionFactory.build(
        { releases: [target] },
        { page: 2, totalPages: 2, releaseCount: 2 },
      ),
    ];

    expect(findCollectionReleaseByInstanceId(pages, "instance-b")).toEqual({
      ...target,
      notes: target.notes ?? [],
    });
  });

  it("patches a release by instance id", () => {
    const release = releaseFactory.build({
      instance_id: "instance-a",
      rating: 0,
    });
    const pages = [
      collectionFactory.build(
        { releases: [release] },
        { page: 1, totalPages: 1, releaseCount: 1 },
      ),
    ];

    const patched = patchCollectionPagesReleaseByInstanceId(
      pages,
      "instance-a",
      { rating: 5 },
    );

    expect(patched[0]?.releases[0]?.rating).toBe(5);
  });
});
