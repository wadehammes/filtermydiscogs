import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PlaylistDrawerStatsPageObject } from "src/components/PlaylistDrawerStats/PlaylistDrawerStats.po";
import { screen, waitFor } from "test-utils";

let po: PlaylistDrawerStatsPageObject;

describe("PlaylistDrawerStats", () => {
  beforeEach(() => {
    po = new PlaylistDrawerStatsPageObject();
  });

  it("opens the stats panel from the footer Stats segment", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    po.renderPlaylistDrawerStats();

    const toggle = await screen.findByTestId(po.statsToggleTestId);

    await waitFor(() => {
      expect(toggle).toBeEnabled();
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: "Playlist stats" })).toBeNull();

    await user.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("region", { name: "Playlist stats" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
