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
      filtersDrawerOpen: false,
      crateDrawerOpen: false,
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

  it("when the filters drawer opens while the panel is expanded, collapses until the drawer closes", () => {
    const { result, rerender } = renderHook(
      (props: { filtersDrawerOpen: boolean }) =>
        useReleaseMiniPlayerVideoPanelState({
          isMiniPlayerVisible: true,
          isPlaying: true,
          filtersDrawerOpen: props.filtersDrawerOpen,
          crateDrawerOpen: false,
          resumePlaybackFromGesture,
        }),
      { initialProps: { filtersDrawerOpen: false } },
    );

    act(() => {
      result.current.handleVideoToggle();
    });

    expect(result.current.isVideoPanelExpanded).toBe(true);

    act(() => {
      rerender({ filtersDrawerOpen: true });
    });

    expect(result.current.isVideoPanelExpanded).toBe(false);

    act(() => {
      rerender({ filtersDrawerOpen: false });
    });

    expect(result.current.isVideoPanelExpanded).toBe(true);
  });
});
