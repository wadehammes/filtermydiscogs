import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseMiniPlayerTransportControls } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayerTransportControls.component";
import { render, screen } from "test-utils";

describe("ReleaseMiniPlayerTransportControls", () => {
  it("toggles playback from the transport bar", async () => {
    const user = userEvent.setup();
    const onTogglePlayback = jest.fn();

    render(
      <ReleaseMiniPlayerTransportControls
        isMobileLayout={false}
        crateToggleButton={null}
        isQueueOpen={false}
        queueButtonAriaLabel="Open queue"
        onQueueToggle={() => undefined}
        isPlaybackReady
        isVideoPanelExpanded={false}
        onVideoToggle={() => undefined}
        hasPrevious={false}
        hasNext={false}
        isPaused
        onPlayPrevious={() => undefined}
        onTogglePlayback={onTogglePlayback}
        onPlayNext={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(onTogglePlayback).toHaveBeenCalledTimes(1);
  });

  it("does not render the video toggle when playback is not ready", () => {
    render(
      <ReleaseMiniPlayerTransportControls
        isMobileLayout={false}
        crateToggleButton={null}
        isQueueOpen={false}
        queueButtonAriaLabel="Open queue"
        onQueueToggle={() => undefined}
        isPlaybackReady={false}
        isVideoPanelExpanded={false}
        onVideoToggle={() => undefined}
        hasPrevious={false}
        hasNext={false}
        isPaused
        onPlayPrevious={() => undefined}
        onTogglePlayback={() => undefined}
        onPlayNext={() => undefined}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Show video" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hide video" }),
    ).not.toBeInTheDocument();
  });

  it("renders the video toggle when playback is ready", () => {
    render(
      <ReleaseMiniPlayerTransportControls
        isMobileLayout={false}
        crateToggleButton={null}
        isQueueOpen={false}
        queueButtonAriaLabel="Open queue"
        onQueueToggle={() => undefined}
        isPlaybackReady
        isVideoPanelExpanded={false}
        onVideoToggle={() => undefined}
        hasPrevious={false}
        hasNext={false}
        isPaused
        onPlayPrevious={() => undefined}
        onTogglePlayback={() => undefined}
        onPlayNext={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Show video" }),
    ).toBeInTheDocument();
  });
});
