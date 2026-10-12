import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseSimilarReleaseItemPageObject } from "src/components/ReleaseSimilarReleaseItem/ReleaseSimilarReleaseItem.po";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { expectReleaseCrateMenuPortaledOutOfHost } from "src/tests/filterControlTestHelpers";
import {
  expectNoReleaseOpenPrefetchAfterHover,
  expectReleaseOpenPrefetchAfterHover,
  setupReleaseOpenPrefetchHoverTimers,
  teardownReleaseOpenPrefetchHoverTimers,
} from "src/tests/utils/expectReleaseOpenPrefetchOnHover";
import { screen, waitFor } from "test-utils";

const defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();

let po: ReleaseSimilarReleaseItemPageObject;

describe("ReleaseSimilarReleaseItem", () => {
  beforeEach(() => {
    po = new ReleaseSimilarReleaseItemPageObject();
  });

  it("prefetches release detail when the row shell is hovered", async () => {
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.renderReleaseSimilarReleaseItem({ onReleaseClick });

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

    po.renderReleaseSimilarReleaseItem({ onReleaseClick });

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByRole("button", { name: "Add to crates" }),
        mockDiscogsRelease: po.mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("does not prefetch release detail when onReleaseClick is omitted", async () => {
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.renderReleaseSimilarReleaseItem();

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

  it("applies listItemInCrate when the release is in the active crate", async () => {
    const similarRelease = releaseFactory.withTitle("Similar Album", 249504, {
      instance_id: "similar-instance",
    });

    po.mockCrateContainsRelease(similarRelease);

    const { container } = po.renderReleaseSimilarReleaseItem({
      release: similarRelease,
    });

    await waitFor(() => {
      const item = container.querySelector(`[data-testid="${po.testId}"]`);
      expect(item?.className).toContain("listItemInCrate");
    });
  });

  it("adds a release to a crate from the row action menu", async () => {
    const user = userEvent.setup();
    const similarRelease = releaseFactory.build({
      instance_id: "similar-instance",
      basic_information: {
        ...releaseFactory.withStyles(["Techno", "House"]).basic_information,
        master_id: 200,
        title: "Similar Album",
      },
    });

    po.renderReleaseSimilarReleaseItem({ release: similarRelease });

    await user.click(screen.getByRole("button", { name: "Add to crates" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitemcheckbox", {
        name: new RegExp(defaultCrateWithCount.name, "i"),
      }),
    );

    await waitFor(() => {
      expect(po.mockApi.addReleaseToCrate).toHaveBeenCalled();
    });
  });

  it("portals the crate menu to document.body", async () => {
    const similarRelease = releaseFactory.build({
      instance_id: "similar-instance",
      basic_information: {
        ...releaseFactory.withStyles(["Techno"]).basic_information,
        master_id: 200,
        title: "Similar Album",
      },
    });

    po.renderReleaseSimilarReleaseItem({ release: similarRelease });

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenuTrigger")).toBeEnabled();
    });

    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole("button", { name: "Add to crates" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    expectReleaseCrateMenuPortaledOutOfHost();
  });
});
