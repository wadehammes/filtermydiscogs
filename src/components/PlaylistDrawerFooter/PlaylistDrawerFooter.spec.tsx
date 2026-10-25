import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PlaylistDrawerFooterPageObject } from "src/components/PlaylistDrawerFooter/PlaylistDrawerFooter.po";
import { screen, waitFor } from "test-utils";

let po: PlaylistDrawerFooterPageObject;

describe("PlaylistDrawerFooter", () => {
  beforeEach(() => {
    po = new PlaylistDrawerFooterPageObject();
  });

  it("renders PlaylistDrawerFooter", () => {
    po.renderPlaylistDrawerFooter();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("opens the rename dialog from the edit menu", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const playlist = po.mockActivePlaylist();
    po.renderPlaylistDrawerFooter(playlist.id);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Rename" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("menuitem", { name: "Rename" }));

    expect(screen.getByTestId(po.renameDialogTestId)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Rename playlist" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Playlist name")).toHaveValue(playlist.name);
  });

  it("opens the delete confirm dialog from the edit menu", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const playlist = po.mockActivePlaylist();
    po.renderPlaylistDrawerFooter(playlist.id);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Delete" }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(
      screen.getByRole("heading", { name: "Delete playlist?" }),
    ).toBeInTheDocument();
  });
});
