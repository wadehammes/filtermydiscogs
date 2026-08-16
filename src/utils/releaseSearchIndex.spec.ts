import { beforeEach, describe, expect, it } from "@jest/globals";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import {
  buildReleaseSearchIndex,
  clearReleaseSearchIndex,
  getReleaseSearchIndexEntry,
  getReleaseSearchText,
  syncReleaseSearchIndex,
} from "./releaseSearchIndex";

describe("releaseSearchIndex", () => {
  beforeEach(() => {
    clearReleaseSearchIndex();
  });

  it("indexes appended releases incrementally during pagination", () => {
    const firstPage = releaseFactory.buildList(2);
    buildReleaseSearchIndex(firstPage);

    const secondPage = [
      ...firstPage,
      ...releaseFactory.buildList(2, {
        basic_information: basicInformationFactory.build({
          title: "Later Page Release",
        }),
      }),
    ];

    syncReleaseSearchIndex(firstPage, secondPage);

    const appendedRelease = secondPage.at(2);
    const firstRelease = firstPage.at(0);
    const firstReleaseAfterSync = secondPage.at(0);

    expect(appendedRelease).toBeDefined();
    expect(firstRelease).toBeDefined();
    expect(firstReleaseAfterSync).toBeDefined();
    expect(getReleaseSearchText(appendedRelease as DiscogsRelease)).toContain(
      "later page release",
    );
    expect(
      getReleaseSearchIndexEntry(firstRelease as DiscogsRelease).genreStyleTags,
    ).toEqual(
      getReleaseSearchIndexEntry(firstReleaseAfterSync as DiscogsRelease)
        .genreStyleTags,
    );
  });

  it("reindexes changed releases when the collection length is unchanged", () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        title: "Original Title",
      }),
    });
    buildReleaseSearchIndex([release]);

    const updatedRelease = {
      ...release,
      basic_information: {
        ...release.basic_information,
        title: "Updated Title",
      },
    };

    syncReleaseSearchIndex([release], [updatedRelease]);

    expect(getReleaseSearchText(updatedRelease)).toContain("updated title");
  });
});
