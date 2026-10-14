import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { CollectionSidePanelTogglePageObject } from "src/components/CollectionSidePanelToggle/CollectionSidePanelToggle.po";
import { screen } from "test-utils";

let po: CollectionSidePanelTogglePageObject;

describe("CollectionSidePanelToggle", () => {
  beforeEach(() => {
    po = new CollectionSidePanelTogglePageObject();
  });

  it("renders crates and playlists segments", () => {
    po.renderCollectionSidePanelToggle();

    expect(
      screen.getByRole("button", { name: "Open crates panel" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open playlists panel" }),
    ).toBeInTheDocument();
  });

  it("does not highlight a segment while deferSegmentHighlight is true", () => {
    po.renderCollectionSidePanelToggle({
      sidePanel: "crates",
      isDrawerOpen: true,
      deferSegmentHighlight: true,
    });

    expect(
      screen.getByRole("button", { name: "Open crates panel" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: "Open playlists panel" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onSelectSidePanel when a segment is clicked", async () => {
    const user = userEvent.setup();
    po.renderCollectionSidePanelToggle();

    await user.click(
      screen.getByRole("button", { name: "Open playlists panel" }),
    );

    expect(po.onSelectSidePanel).toHaveBeenCalledWith("playlists");
  });
});
