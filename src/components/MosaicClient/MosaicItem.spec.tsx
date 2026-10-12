import { beforeEach, describe, it } from "@jest/globals";
import { MosaicItemPageObject } from "src/components/MosaicClient/MosaicItem.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  expectReleaseOpenPrefetchAfterHover,
  setupReleaseOpenPrefetchHoverTimers,
  teardownReleaseOpenPrefetchHoverTimers,
} from "src/tests/utils/expectReleaseOpenPrefetchOnHover";
import { screen } from "test-utils";

let po: MosaicItemPageObject;

describe("MosaicItem", () => {
  beforeEach(() => {
    po = new MosaicItemPageObject();
  });

  it("prefetches release detail when the tile is hovered", async () => {
    const release = releaseFactory.withTitle("Mosaic Album", 249504);
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.renderMosaicItem({ release });

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByRole("button", {
          name: `Open release details for ${release.basic_information.title}`,
        }),
        mockDiscogsRelease: po.mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });
});
