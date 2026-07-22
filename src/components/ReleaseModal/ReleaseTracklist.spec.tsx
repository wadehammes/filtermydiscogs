import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseTracklist } from "src/components/ReleaseModal/ReleaseTracklist.component";
import type { DiscogsTrack } from "src/types";
import { render, screen } from "test-utils";

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

  it("shows a playing indicator on the active track when playback is in progress", () => {
    render(
      <ReleaseTracklist
        tracks={tracks}
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
        activeTrackPosition="A"
        showPlayingIndicatorOnActiveTrack
        onTrackSelect={onTrackSelect}
        onActiveTrackToggle={onActiveTrackToggle}
      />,
    );

    await user.click(
      screen.getByTestId("fmdPlayingIndicator").closest("button")!,
    );

    expect(onActiveTrackToggle).toHaveBeenCalledTimes(1);
    expect(onTrackSelect).not.toHaveBeenCalled();
  });

  it("does not show a playing indicator when playback is not active", () => {
    render(
      <ReleaseTracklist
        tracks={tracks}
        activeTrackPosition="A"
        onTrackSelect={() => undefined}
      />,
    );

    expect(screen.queryByTestId("fmdPlayingIndicator")).toBeNull();
  });

  it("renders empty message when there are no tracks", () => {
    render(
      <ReleaseTracklist
        tracks={[]}
        activeTrackPosition={null}
        onTrackSelect={() => undefined}
      />,
    );

    expect(screen.getByTestId("fmdReleaseTracklistEmpty")).toBeInTheDocument();
  });
});
