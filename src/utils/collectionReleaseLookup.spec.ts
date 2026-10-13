import { describe, expect, it } from "@jest/globals";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { formatFactory } from "src/tests/factories/Format.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  buildReleaseIndexFromList,
  findCollectionReleaseByInstanceId,
  mergeLiveCollectionPageBasicInformationIntoPages,
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

  it("builds a release index from a flat list", () => {
    const releases = releaseFactory.buildList(2);
    const index = buildReleaseIndexFromList(releases);

    expect(index.get(String(releases[1]?.instance_id))).toEqual(releases[1]);
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

  it("merges live basic_information when Discogs metadata changed for a shared instance id", () => {
    const cachedRelease = releaseFactory.withDisplayDefaults({
      instance_id: "9001",
      basic_information: {
        formats: [
          formatFactory.build({ name: "CDr", descriptions: ["Album"] }),
        ],
      },
    });
    const cachedPages = [
      collectionFactory.build(
        { releases: [cachedRelease] },
        { page: 1, totalPages: 1, releaseCount: 1 },
      ),
    ];
    const liveVinylFormat = formatFactory.build({
      name: "Vinyl",
      descriptions: ['12"', "LP"],
    });
    const livePage = collectionFactory.build(
      {
        releases: [
          releaseFactory.withDisplayDefaults({
            instance_id: cachedRelease.instance_id,
            rating: cachedRelease.rating,
            date_added: cachedRelease.date_added,
            notes: cachedRelease.notes,
            basic_information: {
              formats: [liveVinylFormat],
            },
          }),
        ],
      },
      { page: 1, totalPages: 1, releaseCount: 1 },
    );

    const result = mergeLiveCollectionPageBasicInformationIntoPages(
      cachedPages,
      livePage,
    );

    expect(result.updated).toBe(true);
    expect(result.pages[0]?.releases[0]?.basic_information.formats).toEqual([
      liveVinylFormat,
    ]);
    expect(result.pages[0]?.releases[0]?.rating).toBe(cachedRelease.rating);
  });

  it("returns updated false when live page has no metadata changes for cached releases", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: "9001" });
    const pages = [
      collectionFactory.build(
        { releases: [release] },
        { page: 1, totalPages: 1, releaseCount: 1 },
      ),
    ];
    const livePage = collectionFactory.build(
      { releases: [release] },
      { page: 1, totalPages: 1, releaseCount: 1 },
    );

    const result = mergeLiveCollectionPageBasicInformationIntoPages(
      pages,
      livePage,
    );

    expect(result.updated).toBe(false);
    expect(result.pages).toBe(pages);
  });

  it("leaves cached releases unchanged when they are not on the live validation page", () => {
    const cachedOnly = releaseFactory.withDisplayDefaults({
      instance_id: "cached-only",
    });
    const cachedPages = [
      collectionFactory.build(
        { releases: [cachedOnly] },
        { page: 1, totalPages: 1, releaseCount: 1 },
      ),
    ];
    const livePage = collectionFactory.build(
      {
        releases: [
          releaseFactory.withDisplayDefaults({
            instance_id: "live-only",
            basic_information: {
              title: "Different Title",
            },
          }),
        ],
      },
      { page: 1, totalPages: 1, releaseCount: 1 },
    );

    const result = mergeLiveCollectionPageBasicInformationIntoPages(
      cachedPages,
      livePage,
    );

    expect(result.updated).toBe(false);
    expect(result.pages[0]?.releases[0]?.basic_information.title).toBe(
      cachedOnly.basic_information.title,
    );
  });
});
