import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseTracklist } from "src/components/ReleaseTracklist/ReleaseTracklist.component";
import type { DiscogsTrack } from "src/types";
import { render, screen } from "test-utils";

const releaseArtistNames = "Rick Astley";

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

    const queueButtons = screen.getAllByTestId("fmdReleaseTrackQueueButton");

    await user.click(queueButtons[1] as HTMLButtonElement);

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

    await user.click(
      screen.getByRole("button", {
        name: "Remove Never Gonna Give You Up from queue",
      }),
    );

    expect(onTrackUnqueue).toHaveBeenCalledWith("A");
  });

  it("shows a minus remove icon when queued and onTrackUnqueue is set", () => {
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
      screen.getByTestId("fmdReleaseTrackQueueRemoveIcon"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("fmdReleaseTrackQueueCheckIcon"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Remove Never Gonna Give You Up from queue",
      }),
    ).toHaveAttribute("title", "Remove from queue");
  });

  it("shows add to queue on the active row when it is not in up next", () => {
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
      screen.queryByTestId("fmdReleaseTrackQueueRemoveIcon"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Add Never Gonna Give You Up to queue",
      }),
    ).toBeEnabled();
  });

  it("reserves queue column space on non-playable rows when requested", () => {
    const { container } = render(
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

    expect(screen.queryByTestId("fmdReleaseTrackQueueButton")).toBeNull();
    expect(
      container.querySelectorAll('[class*="queueButtonSpacer"]'),
    ).toHaveLength(tracks.length);
  });

  it("disables the add-to-queue control when the track is already queued", () => {
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

    expect(
      screen.getByRole("button", {
        name: "Never Gonna Give You Up is already in the queue",
      }),
    ).toBeDisabled();
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
