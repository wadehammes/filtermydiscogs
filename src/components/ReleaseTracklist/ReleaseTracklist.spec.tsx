import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseTracklist } from "src/components/ReleaseTracklist/ReleaseTracklist.component";
import type { DiscogsTrack } from "src/types";
import { render, screen, waitFor } from "test-utils";

const releaseArtistNames = "Rick Astley";

const openTrackActionsMenu = async (
  user: ReturnType<typeof userEvent.setup>,
  trackTitle: string,
) => {
  const row = screen.getByText(trackTitle).closest("li");
  expect(row).toBeTruthy();
  await user.hover(row as HTMLElement);
  await user.click(
    screen.getByRole("button", { name: `Actions for ${trackTitle}` }),
  );
  await waitFor(() => {
    expect(
      screen.getByTestId("fmdReleaseTrackRowMenuPanel"),
    ).toBeInTheDocument();
  });
};

const tracks: DiscogsTrack[] = [
  {
    position: "A",
    title: "Never Gonna Give You Up",
    duration: "3:32",
    type_: "track",
  },
  {
    position: "B",
    title: "Never Gonna Give You Up (Instrumental)",
    duration: "3:30",
    type_: "track",
  },
];

describe("ReleaseTracklist", () => {
  it("renders tracks and calls onTrackSelect when a row is clicked", async () => {
    const user = userEvent.setup();
    const onTrackSelect = jest.fn();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition="A"
        onTrackSelect={onTrackSelect}
      />,
    );

    expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Never Gonna Give You Up \(Instrumental\)/,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /Never Gonna Give You Up \(Instrumental\)/,
      }),
    );

    expect(onTrackSelect).toHaveBeenCalledWith("B");
  });

  it("shows the track actions menu on static rows when YouTube override is enabled", async () => {
    const user = userEvent.setup();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        onEditTrackYoutube={() => undefined}
      />,
    );

    await openTrackActionsMenu(user, "Never Gonna Give You Up");

    expect(
      screen.getByRole("menuitem", { name: "Add YouTube URL" }),
    ).toBeInTheDocument();
  });

  it("renders static track rows when playback is unavailable", async () => {
    const user = userEvent.setup();
    const onTrackSelect = jest.fn();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition="A"
      />,
    );

    expect(
      screen.getByText("Never Gonna Give You Up (Instrumental)"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Never Gonna Give You Up \(Instrumental\)/,
      }),
    ).toBeNull();

    await user.click(
      screen.getByText("Never Gonna Give You Up (Instrumental)"),
    );

    expect(onTrackSelect).not.toHaveBeenCalled();
  });

  it("shows a playing indicator on the active track when playback is in progress", () => {
    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition="A"
        showPlayingIndicatorOnActiveTrack
        onTrackSelect={() => undefined}
        onActiveTrackToggle={() => undefined}
      />,
    );

    expect(screen.getByTestId("fmdPlayingIndicator")).toHaveAttribute(
      "data-playback-state",
      "playing",
    );
  });

  it("shows a pause indicator when playback is paused on the active track", () => {
    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition="A"
        showPlayingIndicatorOnActiveTrack
        isPlaybackPaused
        onTrackSelect={() => undefined}
        onActiveTrackToggle={() => undefined}
      />,
    );

    expect(screen.getByTestId("fmdPlayingIndicator")).toHaveAttribute(
      "data-playback-state",
      "paused",
    );
  });

  it("calls onActiveTrackToggle when the dock track row is clicked", async () => {
    const user = userEvent.setup();
    const onTrackSelect = jest.fn();
    const onActiveTrackToggle = jest.fn();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition="A"
        showPlayingIndicatorOnActiveTrack
        onTrackSelect={onTrackSelect}
        onActiveTrackToggle={onActiveTrackToggle}
      />,
    );

    const activeTrackButton = screen
      .getByTestId("fmdPlayingIndicator")
      .closest("button");
    expect(activeTrackButton).toBeTruthy();
    await user.click(activeTrackButton as HTMLButtonElement);

    expect(onActiveTrackToggle).toHaveBeenCalledTimes(1);
    expect(onTrackSelect).not.toHaveBeenCalled();
  });

  it("does not show a playing indicator when playback is not active", () => {
    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition="A"
        onTrackSelect={() => undefined}
      />,
    );

    expect(screen.queryByTestId("fmdPlayingIndicator")).toBeNull();
  });

  it("shows per-track credits on Various Artists releases", () => {
    render(
      <ReleaseTracklist
        tracks={[
          {
            position: "A1",
            title: "First Song",
            type_: "track",
            artists: [{ name: "Guest Artist" }],
          },
        ]}
        releaseArtistNames="Various"
        activeTrackPosition={null}
        onTrackSelect={() => undefined}
      />,
    );

    expect(screen.getByText("Guest Artist")).toBeInTheDocument();
  });

  it("renders empty message when there are no tracks", () => {
    render(
      <ReleaseTracklist
        tracks={[]}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        onTrackSelect={() => undefined}
      />,
    );

    expect(screen.getByTestId("fmdReleaseTracklistEmpty")).toBeInTheDocument();
  });

  it("calls onTrackQueue when the add-to-queue control is clicked", async () => {
    const user = userEvent.setup();
    const onTrackQueue = jest.fn();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        onTrackSelect={() => undefined}
        onTrackQueue={onTrackQueue}
      />,
    );

    await openTrackActionsMenu(user, "Never Gonna Give You Up (Instrumental)");
    await user.click(screen.getByRole("menuitem", { name: "Add to queue" }));

    expect(onTrackQueue).toHaveBeenCalledWith("B");
  });

  it("calls onTrackUnqueue when the queued control is clicked", async () => {
    const user = userEvent.setup();
    const onTrackUnqueue = jest.fn();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        onTrackSelect={() => undefined}
        onTrackQueue={() => undefined}
        onTrackUnqueue={onTrackUnqueue}
        isTrackQueued={(position) => position === "A"}
        isTrackUnqueueable={(position) => position === "A"}
      />,
    );

    await openTrackActionsMenu(user, "Never Gonna Give You Up");
    await user.click(
      screen.getByRole("menuitem", { name: "Remove from queue" }),
    );

    expect(onTrackUnqueue).toHaveBeenCalledWith("A");
  });

  it("shows a queue status icon on queued rows without opening the menu", () => {
    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        onTrackSelect={() => undefined}
        onTrackQueue={() => undefined}
        onTrackUnqueue={() => undefined}
        isTrackQueued={(position) => position === "A"}
        isTrackUnqueueable={(position) => position === "A"}
      />,
    );

    expect(
      screen.getByTestId("fmdReleaseTrackQueueStatus"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdReleaseTrackQueueRemoveIcon"),
    ).toBeInTheDocument();
  });

  it("shows a check queue status when queued but not removable from up next", () => {
    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition="A"
        onTrackSelect={() => undefined}
        onTrackQueue={() => undefined}
        onTrackUnqueue={() => undefined}
        isTrackQueued={(position) => position === "A"}
        isTrackUnqueueable={() => false}
      />,
    );

    expect(
      screen.getByTestId("fmdReleaseTrackQueueCheckIcon"),
    ).toBeInTheDocument();
  });

  it("when a track is queued with the row menu, layers the queue check above the menu trigger at rest", () => {
    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        onTrackSelect={() => undefined}
        onTrackQueue={() => undefined}
        isTrackQueued={(position) => position === "A"}
        isTrackUnqueueable={() => false}
      />,
    );

    const row = screen.getByText("Never Gonna Give You Up").closest("li");
    expect(row).toHaveAttribute("data-track-queued-at-rest", "");
    expect(
      screen.getByTestId("fmdReleaseTrackQueueCheckIcon"),
    ).toBeInTheDocument();
    expect(
      row?.querySelector('[data-testid="fmdReleaseTrackRowMenuTrigger"]'),
    ).toBeTruthy();
  });

  it("shows Remove from queue in the menu when queued and onTrackUnqueue is set", async () => {
    const user = userEvent.setup();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        onTrackSelect={() => undefined}
        onTrackQueue={() => undefined}
        onTrackUnqueue={() => undefined}
        isTrackQueued={(position) => position === "A"}
        isTrackUnqueueable={(position) => position === "A"}
      />,
    );

    await openTrackActionsMenu(user, "Never Gonna Give You Up");

    expect(
      screen.getByRole("menuitem", { name: "Remove from queue" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "In queue" }),
    ).not.toBeInTheDocument();
  });

  it("shows add to queue on the active row when it is not in up next", async () => {
    const user = userEvent.setup();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition="A"
        onTrackSelect={() => undefined}
        onTrackQueue={() => undefined}
        onTrackUnqueue={() => undefined}
        isTrackQueued={(position) => position === "A"}
        isTrackUnqueueable={() => false}
      />,
    );

    await openTrackActionsMenu(user, "Never Gonna Give You Up");

    expect(
      screen.queryByRole("menuitem", { name: "Remove from queue" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Add to queue" }),
    ).not.toHaveAttribute("aria-disabled", "true");
  });

  it("reserves queue column space on non-playable rows when requested", () => {
    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        isTrackPlayable={() => false}
        reserveQueueColumn
        onTrackSelect={() => undefined}
        onTrackQueue={() => undefined}
      />,
    );

    expect(screen.queryByTestId("fmdReleaseTrackRowMenuTrigger")).toBeNull();
    expect(screen.getAllByTestId("fmdReleaseTrackQueueIdleIcon")).toHaveLength(
      tracks.length,
    );
  });

  it("when a row has a user YouTube override, shows the row menu trigger instead of the idle queue icon", () => {
    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        isTrackPlayable={() => false}
        reserveQueueColumn
        onTrackSelect={() => undefined}
        onEditTrackYoutube={() => undefined}
        hasUserYoutubeOverride={(position) => position === "A"}
      />,
    );

    expect(screen.queryByTestId("fmdReleaseTrackQueueIdleIcon")).toBeNull();
    expect(screen.getAllByTestId("fmdReleaseTrackRowMenuTrigger")).toHaveLength(
      tracks.length,
    );
  });

  it("when the row menu is available, shows the actions trigger instead of the decorative idle queue icon", () => {
    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        onTrackSelect={() => undefined}
        onTrackQueue={() => undefined}
        isTrackQueued={() => false}
      />,
    );

    expect(screen.queryByTestId("fmdReleaseTrackQueueIdleIcon")).toBeNull();
    expect(screen.getAllByTestId("fmdReleaseTrackRowMenuTrigger")).toHaveLength(
      tracks.length,
    );
  });

  it("shows In queue in the menu when the track is already queued", async () => {
    const user = userEvent.setup();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        isTrackQueued={(position) => position === "A"}
        onTrackSelect={() => undefined}
        onTrackQueue={() => undefined}
      />,
    );

    await openTrackActionsMenu(user, "Never Gonna Give You Up");

    expect(screen.getByRole("menuitem", { name: "In queue" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows Use different video on playable rows that rely on a Discogs embed", async () => {
    const user = userEvent.setup();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        isTrackPlayable={() => true}
        onEditTrackYoutube={() => undefined}
        hasUserYoutubeOverride={() => false}
      />,
    );

    await openTrackActionsMenu(user, "Never Gonna Give You Up");

    expect(
      screen.getByRole("menuitem", { name: "Use different video" }),
    ).toBeInTheDocument();
  });

  it("opens the YouTube override flow from the track menu", async () => {
    const user = userEvent.setup();
    const onEditTrackYoutube = jest.fn();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        isTrackPlayable={() => false}
        reserveQueueColumn
        onTrackSelect={() => undefined}
        onEditTrackYoutube={onEditTrackYoutube}
        hasUserYoutubeOverride={() => false}
      />,
    );

    await openTrackActionsMenu(user, "Never Gonna Give You Up");
    await user.click(screen.getByRole("menuitem", { name: "Add YouTube URL" }));

    expect(onEditTrackYoutube).toHaveBeenCalledWith("A");
  });

  it("renders an add-all toolbar and calls onAddAllToQueue", async () => {
    const user = userEvent.setup();
    const onAddAllToQueue = jest.fn();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        onTrackSelect={() => undefined}
        onTrackQueue={() => undefined}
        onAddAllToQueue={onAddAllToQueue}
      />,
    );

    const addAllButton = screen.getByTestId("fmdReleaseTracklistAddAllButton");

    expect(addAllButton).toHaveTextContent("Add all to queue");
    expect(addAllButton).toBeEnabled();

    await user.click(addAllButton);

    expect(onAddAllToQueue).toHaveBeenCalledTimes(1);
  });

  it("renders remove-all toolbar when every playable track is queued", async () => {
    const user = userEvent.setup();
    const onRemoveAllFromQueue = jest.fn();

    render(
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={null}
        onTrackSelect={() => undefined}
        onTrackQueue={() => undefined}
        onAddAllToQueue={() => undefined}
        onRemoveAllFromQueue={onRemoveAllFromQueue}
        allPlayableTracksQueued
      />,
    );

    const removeAllButton = screen.getByTestId(
      "fmdReleaseTracklistRemoveAllButton",
    );

    expect(removeAllButton).toHaveTextContent("Remove all from queue");
    expect(removeAllButton).toBeEnabled();
    expect(
      screen.queryByTestId("fmdReleaseTracklistAddAllButton"),
    ).not.toBeInTheDocument();

    await user.click(removeAllButton);

    expect(onRemoveAllFromQueue).toHaveBeenCalledTimes(1);
  });
});
