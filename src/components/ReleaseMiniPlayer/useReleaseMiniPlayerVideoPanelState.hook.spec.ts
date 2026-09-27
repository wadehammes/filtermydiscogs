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
      isPlaybackReady: true,
      shouldAutoplayEmbed: true,
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

  it.each([
    { drawer: "crate drawer", crateDrawerOpen: true, filtersDrawerOpen: false },
    {
      drawer: "filters drawer",
      crateDrawerOpen: false,
      filtersDrawerOpen: true,
    },
  ])(
    "auto-expands when autoplay playback is ready even while the $drawer is open",
    ({ crateDrawerOpen, filtersDrawerOpen }) => {
      const { result } = renderVideoPanelState({
        crateDrawerOpen,
        filtersDrawerOpen,
      });

      expect(result.current.isVideoPanelExpanded).toBe(true);
    },
  );

  it("collapses the panel when the filters drawer opens during non-autoplay playback", () => {
    const { result, rerender } = renderHook(
      (props: { filtersDrawerOpen: boolean; shouldAutoplayEmbed: boolean }) =>
        useReleaseMiniPlayerVideoPanelState({
          isMiniPlayerVisible: true,
          isPlaybackReady: true,
          shouldAutoplayEmbed: props.shouldAutoplayEmbed,
          isPlaying: true,
          filtersDrawerOpen: props.filtersDrawerOpen,
          crateDrawerOpen: false,
          resumePlaybackFromGesture,
        }),
      {
        initialProps: {
          filtersDrawerOpen: false,
          shouldAutoplayEmbed: true,
        },
      },
    );

    expect(result.current.isVideoPanelExpanded).toBe(true);

    act(() => {
      rerender({ filtersDrawerOpen: true, shouldAutoplayEmbed: false });
    });

    expect(result.current.isVideoPanelExpanded).toBe(false);
  });

  it("does not auto-expand after the listener manually collapsed the video panel", () => {
    const { result } = renderVideoPanelState();

    act(() => {
      result.current.handleVideoToggle();
    });

    expect(result.current.isVideoPanelExpanded).toBe(false);
  });
});
