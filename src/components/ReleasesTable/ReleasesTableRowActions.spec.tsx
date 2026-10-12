import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleasesTableRowActionsPageObject } from "src/components/ReleasesTable/ReleasesTableRowActions.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  expectReleaseOpenPrefetchAfterHover,
  setupReleaseOpenPrefetchHoverTimers,
  teardownReleaseOpenPrefetchHoverTimers,
} from "src/tests/utils/expectReleaseOpenPrefetchOnHover";
import { screen, waitFor } from "test-utils";

let po: ReleasesTableRowActionsPageObject;

describe("ReleasesTableRowActions", () => {
  beforeEach(() => {
    po = new ReleasesTableRowActionsPageObject();
  });

  it("prefetches release detail when a row action is hovered", async () => {
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.renderReleasesTableRowActions();

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId("fmdReleaseTableAddToQueueButton"),
        mockDiscogsRelease: po.mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("opens release details and notes from icon actions", async () => {
    const release = releaseFactory.forNotesEditor(12345, { notes: [] });
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    po.renderReleasesTableRowActions({ release, onReleaseClick });

    await user.click(
      screen.getByRole("button", { name: "Open release details" }),
    );
    expect(onReleaseClick).toHaveBeenCalledWith(release);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add release notes" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add release notes" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
