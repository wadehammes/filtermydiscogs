import { act, renderHook } from "@testing-library/react";

import { useReleaseMiniPlayerVideoPanelState } from "./useReleaseMiniPlayerVideoPanelState.hook";

const resumePlaybackFromGesture = jest.fn();

const renderVideoPanelState = (
  overrides: Partial<
    Parameters<typeof useReleaseMiniPlayerVideoPanelState>[0]
  > = {},
) =>
  renderHook(() =>
    useReleaseMiniPlayerVideoPanelState({
      isMiniPlayerVisible: true,
      isPlaying: true,
      resumePlaybackFromGesture,
      ...overrides,
    }),
  );

describe("useReleaseMiniPlayerVideoPanelState", () => {
  beforeEach(() => {
    resumePlaybackFromGesture.mockClear();
  });

  it("when playback becomes ready, keeps the video panel collapsed until the listener opens it", () => {
    const { result } = renderVideoPanelState();

    expect(result.current.isVideoPanelExpanded).toBe(false);
  });

  it("when the listener toggles the video control, expands and collapses the panel", () => {
    const { result } = renderVideoPanelState();

    act(() => {
      result.current.handleVideoToggle();
    });

    expect(result.current.isVideoPanelExpanded).toBe(true);

    act(() => {
      result.current.handleVideoToggle();
    });

    expect(result.current.isVideoPanelExpanded).toBe(false);
  });

  it("when the listener opens the panel while a drawer is up, keeps the expanded override", () => {
    const { result } = renderVideoPanelState();

    act(() => {
      result.current.handleVideoToggle();
    });

    expect(result.current.isVideoPanelExpanded).toBe(true);
  });
});
