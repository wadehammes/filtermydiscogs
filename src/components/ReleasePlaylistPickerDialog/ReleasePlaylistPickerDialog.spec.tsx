import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import type { ReleasePlaylistPickerSubmenuPanelProps } from "src/components/ReleasePlaylistPickerDialog/ReleasePlaylistPickerDialog.component";
import { ReleasePlaylistPickerDialogPageObject } from "src/components/ReleasePlaylistPickerDialog/ReleasePlaylistPickerDialog.po";
import { playlistSummaryFactory } from "src/tests/factories/PlaylistSummary.factory";
import { screen } from "test-utils";
import styles from "./ReleasePlaylistPickerDialog.module.css";

let po: ReleasePlaylistPickerDialogPageObject;

describe("ReleasePlaylistPickerSubmenu", () => {
  beforeEach(() => {
    po = new ReleasePlaylistPickerDialogPageObject();
  });

  it("renders playlist picker submenu panel", () => {
    po.renderReleasePlaylistPickerSubmenu();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("shows a check when the track is already in the playlist", () => {
    po.renderReleasePlaylistPickerSubmenu({
      sortedPlaylists: [
        playlistSummaryFactory.empty({
          name: "Good Shit",
          trackCount: 2,
          containsTrack: true,
        }),
        playlistSummaryFactory.empty({
          id: "playlist-other",
          name: "Other",
          trackCount: 0,
          containsTrack: false,
        }),
      ],
    });

    expect(
      screen.getByRole("menuitem", {
        name: "Good Shit (2), already in playlist",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Other (0)" }),
    ).toBeInTheDocument();
    const inPlaylistRow = screen.getByRole("menuitem", {
      name: "Good Shit (2), already in playlist",
    });
    expect(
      inPlaylistRow.querySelector(`.${styles.membershipCheckIcon}`),
    ).not.toBeNull();
    expect(
      inPlaylistRow.querySelector(`.${styles.membershipRemoveIcon}`),
    ).not.toBeNull();
  });

  it("when picking a playlist that already contains the track, passes containsTrack to onPickPlaylist", async () => {
    const user = userEvent.setup();
    const onPickPlaylist =
      jest.fn<ReleasePlaylistPickerSubmenuPanelProps["onPickPlaylist"]>();

    po.renderReleasePlaylistPickerSubmenu({
      sortedPlaylists: [
        playlistSummaryFactory.empty({
          id: "playlist-in",
          name: "Testing",
          trackCount: 3,
          containsTrack: true,
        }),
      ],
      onPickPlaylist,
    });

    await user.click(
      screen.getByRole("menuitem", {
        name: "Testing (3), already in playlist",
      }),
    );

    expect(onPickPlaylist).toHaveBeenCalledWith("playlist-in", "Testing", true);
  });

  it("when picking a playlist the track is not in, passes containsTrack false to onPickPlaylist", async () => {
    const user = userEvent.setup();
    const onPickPlaylist =
      jest.fn<ReleasePlaylistPickerSubmenuPanelProps["onPickPlaylist"]>();

    po.renderReleasePlaylistPickerSubmenu({
      sortedPlaylists: [
        playlistSummaryFactory.empty({
          id: "playlist-new",
          name: "Weekend spins",
          trackCount: 2,
          containsTrack: false,
        }),
      ],
      onPickPlaylist,
    });

    await user.click(
      screen.getByRole("menuitem", { name: "Weekend spins (2)" }),
    );

    expect(onPickPlaylist).toHaveBeenCalledWith(
      "playlist-new",
      "Weekend spins",
      false,
    );
  });
});
