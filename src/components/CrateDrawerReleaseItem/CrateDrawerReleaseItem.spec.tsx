import { beforeEach, describe, it } from "@jest/globals";
import { CrateDrawerReleaseItemPageObject } from "src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.po";
import {
  expectNoReleaseOpenPrefetchAfterHover,
  expectReleaseOpenPrefetchAfterHover,
  setupReleaseOpenPrefetchHoverTimers,
  teardownReleaseOpenPrefetchHoverTimers,
} from "src/tests/utils/expectReleaseOpenPrefetchOnHover";
import { screen } from "test-utils";

let po: CrateDrawerReleaseItemPageObject;

describe("CrateDrawerReleaseItem", () => {
  beforeEach(() => {
    po = new CrateDrawerReleaseItemPageObject();
  });

  it("prefetches release detail when the row shell is hovered", async () => {
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.renderCrateDrawerReleaseItem({ onReleaseClick });

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

  it("prefetches release detail when a row action is hovered", async () => {
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.renderCrateDrawerReleaseItem({ onReleaseClick });

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByRole("button", {
          name: `Remove ${po.defaultRelease.basic_information.title} from crate`,
        }),
        mockDiscogsRelease: po.mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("does not prefetch release detail when onReleaseClick is omitted", async () => {
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.renderCrateDrawerReleaseItem();

    try {
      await expectNoReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId(po.testId),
        mockDiscogsRelease: po.mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });
});
