import { beforeEach, describe, it } from "@jest/globals";
import { DashboardReleaseItemPageObject } from "src/components/Dashboard/DashboardReleaseItem.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  expectReleaseOpenPrefetchAfterHover,
  setupReleaseOpenPrefetchHoverTimers,
  teardownReleaseOpenPrefetchHoverTimers,
} from "src/tests/utils/expectReleaseOpenPrefetchOnHover";
import { screen } from "test-utils";

let po: DashboardReleaseItemPageObject;

describe("DashboardReleaseItem", () => {
  beforeEach(() => {
    po = new DashboardReleaseItemPageObject();
  });

  it("prefetches release detail when the row shell is hovered", async () => {
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.renderDashboardReleaseItem();

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId(po.testId),
        mockDiscogsRelease: po.mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("prefetches release detail when the artist link is hovered", async () => {
    const release = releaseFactory.withTitle("Dashboard Album", 249504);
    const artistName =
      release.basic_information.artists[0]?.name ?? "Test Artist";
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.renderDashboardReleaseItem({ release });

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByRole("link", { name: artistName }),
        mockDiscogsRelease: po.mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });
});
