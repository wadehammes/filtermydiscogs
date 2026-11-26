import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PlaylistDrawerStatsPageObject } from "src/components/PlaylistDrawerStats/PlaylistDrawerStats.po";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { screen, waitFor } from "test-utils";

let po: PlaylistDrawerStatsPageObject;

describe("PlaylistDrawerStats", () => {
  beforeEach(() => {
    po = new PlaylistDrawerStatsPageObject();
  });

  it.each([
    { label: "desktop", desktop: true },
    { label: "mobile", desktop: false },
  ])(
    "opens the stats panel from the More menu on $label",
    async ({ desktop }) => {
      setupMockMatchMedia({ desktop });
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      po.renderPlaylistDrawerStats();

      await user.click(screen.getByRole("button", { name: "More" }));

      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: "Stats" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("menuitem", { name: "Stats" }));

      await waitFor(() => {
        expect(
          screen.getByRole("region", { name: "Playlist stats" }),
        ).toBeInTheDocument();
      });
      expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    },
  );
});
