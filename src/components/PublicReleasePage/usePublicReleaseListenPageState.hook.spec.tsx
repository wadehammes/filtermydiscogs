jest.mock("src/api/urls", () => ({
  api: {
    discogsRelease: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  ...jest.requireActual<typeof import("next/navigation")>("next/navigation"),
  useRouter: () => ({
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    push: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => "/release/249504",
  useSearchParams: () => new URLSearchParams(),
}));

import type { ReactNode } from "react";
import { api } from "src/api/urls";
import { PlaybackProvidersShell } from "src/components/PlaybackProvidersShell.component";
import { usePublicReleaseListenPageState } from "src/components/PublicReleasePage/usePublicReleaseListenPageState.hook";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testUnauthenticatedAuthState } from "src/tests/utils/testProviders";
import { renderFeatureHook, waitFor } from "test-utils";

const mockDiscogsReleaseApi = jest.mocked(api.discogsRelease);

describe("usePublicReleaseListenPageState", () => {
  const releaseId = "249504";

  const renderListenHook = (
    initialDiscogsReleaseDetail?: ReturnType<
      typeof discogsReleaseJsonFactory.withTracklistAndVideos
    >,
  ) =>
    renderFeatureHook(
      () =>
        usePublicReleaseListenPageState({
          releaseId,
          ...(initialDiscogsReleaseDetail !== undefined
            ? { initialDiscogsReleaseDetail }
            : {}),
        }),
      {
        authInitialState: testUnauthenticatedAuthState,
        includeCollectionSync: false,
        wrapper: ({ children }: { children: ReactNode }) => (
          <PlaybackProvidersShell>{children}</PlaybackProvidersShell>
        ),
      },
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when initialDiscogsReleaseDetail matches releaseId, exposes detail and does not stay in skeleton state", async () => {
    const initial = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: Number(releaseId),
    });
    mockApiResponse(
      true,
      mockDiscogsReleaseApi,
      initial,
      new Error("Discogs release request failed"),
    );

    const { result } = renderListenHook(initial);

    await waitFor(() => {
      expect(result.current.detail).not.toBeNull();
    });

    expect(result.current.isPendingSkeleton).toBe(false);
    expect(result.current.detail?.title).toBe("Never Gonna Give You Up");
    expect(mockDiscogsReleaseApi).not.toHaveBeenCalled();
  });

  it("when detail includes a primary images entry, coverHeroUrl uses that URI instead of thumb", async () => {
    const initial = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: Number(releaseId),
      thumb: "https://i.discogs.com/thumb-fallback.jpg",
      images: [
        { type: "primary", uri: "https://i.discogs.com/primary-cover.jpg" },
      ],
    });
    mockApiResponse(
      true,
      mockDiscogsReleaseApi,
      initial,
      new Error("Discogs release request failed"),
    );

    const { result } = renderListenHook(initial);

    await waitFor(() => {
      expect(result.current.detail).not.toBeNull();
    });

    expect(result.current.coverHeroUrl).toBe(
      "https://i.discogs.com/primary-cover.jpg",
    );
  });

  it("when no initial detail, calls api.discogsRelease and resolves detail after fetch", async () => {
    mockApiResponse(
      true,
      mockDiscogsReleaseApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({
        id: Number(releaseId),
      }),
      new Error("Discogs release request failed"),
    );

    const { result } = renderListenHook();

    await waitFor(() => {
      expect(result.current.detail).not.toBeNull();
    });

    expect(mockDiscogsReleaseApi).toHaveBeenCalledWith(releaseId);
    expect(result.current.isPendingSkeleton).toBe(false);
  });
});
