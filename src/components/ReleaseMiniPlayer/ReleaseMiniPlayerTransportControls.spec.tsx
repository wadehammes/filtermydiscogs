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
});
