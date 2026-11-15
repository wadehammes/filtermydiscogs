import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseMiniPlayerDigControlsPageObject } from "src/components/ReleaseMiniPlayerDigControls/ReleaseMiniPlayerDigControls.po";
import type { ReleasePlaybackActions } from "src/types/releasePlaybackContext.types";
import { screen, waitFor } from "test-utils";

let po: ReleaseMiniPlayerDigControlsPageObject;

const mockLayoutRect = {
  width: 240,
  height: 24,
  top: 0,
  left: 0,
  right: 240,
  bottom: 24,
  x: 0,
  y: 0,
  toJSON: () => {},
} as DOMRect;

const createIdleActions = (
  overrides: Partial<ReleasePlaybackActions> = {},
): ReleasePlaybackActions => ({
  startPlayback: jest.fn(),
  startReleasePreview: jest.fn(),
  addToQueue: jest.fn(),
  addPreviewToQueue: jest.fn(),
  removeAlbumTracksFromQueue: jest.fn(),
  removeFromQueue: jest.fn(),
  reorderQueue: jest.fn(),
  playQueueAtIndex: jest.fn(),
  playNext: jest.fn(),
  playPrevious: jest.fn(),
  togglePlayback: jest.fn(),
  registerPlaybackIframe: jest.fn(),
  notifyPlaybackIframeLoaded: jest.fn(),
  notifyPlaybackVideoLoadStarted: jest.fn(),
  notifyPlaybackVideoPresentationReady: jest.fn(),
  resumePlaybackFromGesture: jest.fn(),
  clearQueue: jest.fn(),
  replaceUpcomingQueue: jest.fn(),
  stopPlayback: jest.fn(),
  seekPlayback: jest.fn(),
  setPlaybackVolume: jest.fn(),
  togglePlaybackMute: jest.fn(),
  ...overrides,
});

describe("ReleaseMiniPlayerDigScrub", () => {
  beforeEach(() => {
    po = new ReleaseMiniPlayerDigControlsPageObject();
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(mockLayoutRect);
  });

  it("when playback is ready, renders the timeline between meta and transport", () => {
    po.renderDigScrub({
      actions: createIdleActions(),
      embedProgress: { currentTime: 30, duration: 180 },
    });

    expect(screen.getByTestId(po.scrubTestId)).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdPlaybackDockProgressSlider"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("fmdPlaybackDockTimeLabel")).toHaveTextContent(
      "0:30",
    );
  });

  it("when the listener skips forward ten seconds, seeks playback", async () => {
    const seekPlayback = jest.fn();
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    po.renderDigScrub({
      actions: createIdleActions({ seekPlayback }),
      embedProgress: { currentTime: 30, duration: 180 },
    });

    await user.click(screen.getByRole("button", { name: "+10s" }));

    expect(seekPlayback).toHaveBeenCalledWith(40);
  });
});

describe("ReleaseMiniPlayerVolumePopover", () => {
  beforeEach(() => {
    po = new ReleaseMiniPlayerDigControlsPageObject();
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(mockLayoutRect);
  });

  it("when the volume trigger is clicked, opens a popover with a volume slider", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    po.renderVolumePopover({
      actions: createIdleActions(),
      embedProgress: { currentTime: 0, duration: 120 },
    });

    await user.click(screen.getByRole("button", { name: "Playback volume" }));

    await waitFor(() => {
      expect(screen.getByTestId(po.volumePopoverTestId)).toBeInTheDocument();
    });
    expect(
      screen.getByTestId("fmdPlaybackDockVolumeSlider"),
    ).toBeInTheDocument();
  });

  it("when dock volume is stored at zero, shows the muted icon", () => {
    po.renderVolumePopover({
      actions: createIdleActions(),
      embedProgress: { currentTime: 0, duration: 120 },
      state: { isPlaybackDockMuted: true },
    });

    expect(
      screen.getByRole("button", { name: "Playback volume" }),
    ).toBeInTheDocument();
  });

  it("when mute is chosen inside the popover, calls togglePlaybackMute", async () => {
    const togglePlaybackMute = jest.fn();
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    po.renderVolumePopover({
      actions: createIdleActions({ togglePlaybackMute }),
      embedProgress: { currentTime: 0, duration: 120 },
    });

    await user.click(screen.getByRole("button", { name: "Playback volume" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Mute" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Mute" }));

    expect(togglePlaybackMute).toHaveBeenCalledTimes(1);
  });
});
