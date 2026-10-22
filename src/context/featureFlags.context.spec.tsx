import { describe, expect, it } from "@jest/globals";
import { renderHook } from "test-utils";
import {
  FeatureFlagProvider,
  FeatureFlagsClientSync,
  useFeatureFlag,
  useFeatureFlags,
} from "./featureFlags.context";

describe("FeatureFlagProvider", () => {
  it("useFeatureFlags and useFeatureFlag read the provided snapshot", () => {
    const flags = { playlists: true };

    const { result } = renderHook(
      () => ({
        flags: useFeatureFlags(),
        playlistFlag: useFeatureFlag("playlists"),
      }),
      {
        wrapper: ({ children }) => (
          <FeatureFlagProvider featureFlags={flags}>
            {children}
          </FeatureFlagProvider>
        ),
      },
    );

    expect(result.current.flags).toEqual({ playlists: true });
    expect(result.current.playlistFlag).toBe(true);
  });

  it("FeatureFlagsClientSync applies featureFlags via useLayoutEffect", () => {
    const { result } = renderHook(() => useFeatureFlag("playlists"), {
      wrapper: ({ children }) => (
        <FeatureFlagProvider featureFlags={{ playlists: false }}>
          <FeatureFlagsClientSync featureFlags={{ playlists: true }} />
          {children}
        </FeatureFlagProvider>
      ),
    });

    expect(result.current).toBe(true);
  });
});
