import { createStore } from "jotai";
import { playbackDockMobileInScrollAtom } from "src/atoms/playbackDockUi.atoms";
import { usePlaybackDockMobileInScroll } from "src/hooks/usePlaybackDockMobileInScroll.hook";
import { renderHook, renderWithStore } from "test-utils";

describe("usePlaybackDockMobileInScroll", () => {
  it("when enabled, sets playbackDockMobileInScrollAtom to true", () => {
    const store = createStore();

    renderHook(() => usePlaybackDockMobileInScroll(true), {
      wrapper: renderWithStore(store),
    });

    expect(store.get(playbackDockMobileInScrollAtom)).toBe(true);
  });

  it("when disabled, leaves playbackDockMobileInScrollAtom false", () => {
    const store = createStore();

    renderHook(() => usePlaybackDockMobileInScroll(false), {
      wrapper: renderWithStore(store),
    });

    expect(store.get(playbackDockMobileInScrollAtom)).toBe(false);
  });

  it("when enabled then unmounted, resets playbackDockMobileInScrollAtom to false", () => {
    const store = createStore();

    const { unmount } = renderHook(
      () => usePlaybackDockMobileInScroll(true),
      {
        wrapper: renderWithStore(store),
      },
    );

    expect(store.get(playbackDockMobileInScrollAtom)).toBe(true);

    unmount();

    expect(store.get(playbackDockMobileInScrollAtom)).toBe(false);
  });
});