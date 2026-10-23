import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseTrackRowMenuPageObject } from "src/components/ReleaseTrackRowMenu/ReleaseTrackRowMenu.po";
import { trackMetadataBodyFactory } from "src/tests/factories/TrackMetadataBody.factory";
import { expectPortaledPopupAttachedToBody } from "src/tests/filterControlTestHelpers";
import { screen, waitFor, within } from "test-utils";
import styles from "./ReleaseTrackRowMenu.module.css";

let po: ReleaseTrackRowMenuPageObject;

describe("ReleaseTrackRowMenu", () => {
  beforeEach(() => {
    po = new ReleaseTrackRowMenuPageObject();
  });

  it("calls onAddToQueue when Add to queue is chosen", async () => {
    const user = userEvent.setup();
    const onAddToQueue = jest.fn();

    po.renderReleaseTrackRowMenu({ onAddToQueue });

    await user.click(screen.getByTestId("fmdReleaseTrackRowMenuTrigger"));
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Add to queue" }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole("menuitem", { name: "Add to queue" }));

    expect(onAddToQueue).toHaveBeenCalledTimes(1);
  });

  it("calls onRemoveFromQueue when Remove from queue is chosen", async () => {
    const user = userEvent.setup();
    const onRemoveFromQueue = jest.fn();

    po.renderReleaseTrackRowMenu({
      canAddToQueue: false,
      canUnqueue: true,
      isQueued: true,
      onRemoveFromQueue,
    });

    await user.click(screen.getByTestId("fmdReleaseTrackRowMenuTrigger"));
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Remove from queue" }),
      ).toBeInTheDocument();
    });
    await user.click(
      screen.getByRole("menuitem", { name: "Remove from queue" }),
    );

    expect(onRemoveFromQueue).toHaveBeenCalledTimes(1);
  });

  it("shows Add YouTube URL when there is no default embed or user link", async () => {
    const user = userEvent.setup();

    po.renderReleaseTrackRowMenu({
      canAddToQueue: false,
      hasDefaultYoutubeEmbed: false,
      hasUserYoutubeOverride: false,
      onEditYoutube: () => undefined,
    });

    await user.click(screen.getByTestId("fmdReleaseTrackRowMenuTrigger"));
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Add YouTube URL" }),
      ).toBeInTheDocument();
    });
  });

  it("shows Use different video when the track already has a Discogs embed", async () => {
    const user = userEvent.setup();

    po.renderReleaseTrackRowMenu({
      canAddToQueue: false,
      hasDefaultYoutubeEmbed: true,
      hasUserYoutubeOverride: false,
      onEditYoutube: () => undefined,
    });

    await user.click(screen.getByTestId("fmdReleaseTrackRowMenuTrigger"));
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Use different video" }),
      ).toBeInTheDocument();
    });
  });

  it("when the track has a user YouTube override but is not queued, does not use queued menu trigger styling", () => {
    po.renderReleaseTrackRowMenu({
      canAddToQueue: false,
      hasUserYoutubeOverride: true,
      isQueued: false,
      onEditYoutube: () => undefined,
    });

    expect(screen.getByTestId("fmdReleaseTrackRowMenuTrigger")).not.toHaveClass(
      styles.menuTriggerQueued,
    );
  });

  it("when the track is queued, uses queued menu trigger styling", () => {
    po.renderReleaseTrackRowMenu({
      canAddToQueue: false,
      isQueued: true,
    });

    expect(screen.getByTestId("fmdReleaseTrackRowMenuTrigger")).toHaveClass(
      styles.menuTriggerQueued,
    );
  });

  it("calls onEditYoutube and shows Edit when a user override exists", async () => {
    const user = userEvent.setup();
    const onEditYoutube = jest.fn();

    po.renderReleaseTrackRowMenu({
      canAddToQueue: false,
      hasUserYoutubeOverride: true,
      onEditYoutube,
    });

    await user.click(screen.getByTestId("fmdReleaseTrackRowMenuTrigger"));
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Edit YouTube URL" }),
      ).toBeInTheDocument();
    });
    await user.click(
      screen.getByRole("menuitem", { name: "Edit YouTube URL" }),
    );

    expect(onEditYoutube).toHaveBeenCalledTimes(1);
  });

  it("shows a disabled In queue item when the track is queued but not removable", async () => {
    const user = userEvent.setup();

    po.renderReleaseTrackRowMenu({
      canAddToQueue: false,
      isQueued: true,
    });

    await user.click(screen.getByTestId("fmdReleaseTrackRowMenuTrigger"));
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "In queue" }),
      ).toHaveAttribute("aria-disabled", "true");
    });
  });

  it("renders nothing when there are no menu actions", () => {
    po.renderReleaseTrackRowMenu({
      canAddToQueue: false,
      releaseHasQueueActions: false,
      omitOnAddToQueue: true,
    });

    expect(screen.queryByTestId(po.testId)).toBeNull();
  });

  it("shows a disabled Add to queue when the release has queue actions but the row cannot queue", async () => {
    const user = userEvent.setup();

    po.renderReleaseTrackRowMenu({
      canAddToQueue: false,
      releaseHasQueueActions: true,
      omitOnAddToQueue: true,
    });

    await user.click(screen.getByTestId("fmdReleaseTrackRowMenuTrigger"));

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Add to queue" }),
      ).toHaveAttribute("aria-disabled", "true");
    });
  });

  it("opens CreatePlaylistDialog after choosing Create new playlist when the track menu closes", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    po.renderReleaseTrackRowMenu({
      playlistPickerMetadata: trackMetadataBodyFactory.opening(),
      useMenuOverlayStack: true,
      playlistSubmenuOpenOnHover: false,
    });

    await user.click(screen.getByTestId("fmdReleaseTrackRowMenuTrigger"));
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Add to queue" }),
      ).toBeInTheDocument();
    });

    const addToPlaylistItem = screen.getByRole("menuitem", {
      name: /Add Test track to playlist/i,
    });
    await user.click(addToPlaylistItem);

    await waitFor(() => {
      expect(addToPlaylistItem).toHaveAttribute("aria-expanded", "true");
    });

    const playlistPickerPanel = await screen.findByTestId(
      po.playlistPickerSubmenuTestId,
    );
    const createPlaylistItem = within(playlistPickerPanel).getByRole(
      "menuitem",
      { name: "Create new playlist…" },
    );

    await user.click(createPlaylistItem);

    await waitFor(() => {
      expect(
        screen.getByTestId(po.createPlaylistDialogTestId),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("dialog", { name: "Create playlist" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId(po.menuPanelTestId)).not.toBeInTheDocument();
    });
  });

  it("portals the menu panel to document.body when useMenuOverlayStack is enabled", async () => {
    const user = userEvent.setup();

    po.renderReleaseTrackRowMenu({ useMenuOverlayStack: true });

    await user.click(screen.getByTestId("fmdReleaseTrackRowMenuTrigger"));

    const panel = await screen.findByTestId("fmdReleaseTrackRowMenuPanel");
    expectPortaledPopupAttachedToBody(panel);
  });

  it("blurs the trigger after the menu closes so hover-only chrome can hide", async () => {
    const user = userEvent.setup();
    const blurSpy = jest.spyOn(HTMLButtonElement.prototype, "blur");

    po.renderReleaseTrackRowMenu();

    await user.click(screen.getByTestId("fmdReleaseTrackRowMenuTrigger"));
    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Add to queue" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("menuitem", { name: "Add to queue" }));

    await waitFor(() => {
      expect(blurSpy).toHaveBeenCalled();
    });

    blurSpy.mockRestore();
  });
});
