import type { ReactNode } from "react";
import { useLayoutEffect, useMemo, useRef } from "react";
import { api } from "src/api/urls";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import { useFiltersDispatch } from "src/hooks/useFilterAtoms.hook";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { DiscogsRelease } from "src/types";
import {
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS,
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_SLOW_MS,
} from "src/utils/playbackEmbedStartWatchdog";
import {
  EMBED_WATCHDOG_SYNC_PROBE_RECHECK_MS,
  PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS,
} from "src/utils/releasePlaybackEmbedConfirm";
import { act } from "test-utils";

const advanceEmbedWatchdogSyncProbeRecheck = () => {
  act(() => {
    jest.advanceTimersByTime(EMBED_WATCHDOG_SYNC_PROBE_RECHECK_MS);
  });
};

const resolveFirstSessionEmbedWatchdogArmMs = () =>
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS +
  PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS;

const resolveFirstSessionEmbedWatchdogArmMsForSlow = () =>
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_SLOW_MS +
  PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS;

const advanceFirstSessionEmbedWatchdogFire = () => {
  act(() => {
    jest.advanceTimersByTime(resolveFirstSessionEmbedWatchdogArmMs());
  });
  advanceEmbedWatchdogSyncProbeRecheck();
};

const setDocumentVisibilityState = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
};

const dispatchYoutubePlayerError = ({
  contentWindow,
  errorCode,
}: {
  contentWindow: Window;
  errorCode: number;
}) => {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: JSON.stringify({ event: "onError", info: errorCode }),
      origin: "https://www.youtube-nocookie.com",
      source: contentWindow,
    }),
  );
};

const dispatchYoutubeEmbedReady = ({
  contentWindow,
}: {
  contentWindow: Window;
}) => {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: JSON.stringify({ event: "onReady", info: 1 }),
      origin: "https://www.youtube-nocookie.com",
      source: contentWindow,
    }),
  );
};

const dispatchYoutubePlayerState = ({
  contentWindow,
  playerState,
  event = "onStateChange",
}: {
  contentWindow: Window;
  playerState: number;
  event?: "onStateChange" | "infoDelivery";
}) => {
  const data =
    event === "infoDelivery"
      ? JSON.stringify({
          event: "infoDelivery",
          info: { playerState },
        })
      : JSON.stringify({ event: "onStateChange", info: playerState });

  window.dispatchEvent(
    new MessageEvent("message", {
      data,
      origin: "https://www.youtube-nocookie.com",
      source: contentWindow,
    }),
  );
};

const dispatchYoutubeInfoDelivery = ({
  contentWindow,
  info,
}: {
  contentWindow: Window;
  info: {
    playerState?: number;
    currentTime?: number;
    duration?: number;
  };
}) => {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: JSON.stringify({
        event: "infoDelivery",
        info,
      }),
      origin: "https://www.youtube-nocookie.com",
      source: contentWindow,
    }),
  );
};

const mockApi = jest.mocked(api);
const preferencesApiError = new Error("Preferences API request failed");

const mockUserPreferencesResponse = (
  preferences = userPreferencesFactory.defaults(),
) => {
  mockApiResponse(
    true,
    mockApi.userPreferences,
    { preferences },
    preferencesApiError,
  );
};

const RELEASE_ID = 249504;

const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: RELEASE_ID,
  tracklist: [
    discogsTrackFactory.build({
      position: "A1",
      title: "Never Gonna Give You Up",
      duration: "3:32",
      type_: "track",
    }),
    discogsTrackFactory.build({
      position: "B1",
      title: "Never Gonna Give You Up (Instrumental)",
      duration: "3:30",
      type_: "track",
    }),
  ],
  videos: [
    discogsVideoFactory.youtube({
      description: "Rick Astley - Never Gonna Give You Up",
      duration: 330,
      title: "Rick Astley - Never Gonna Give You Up",
      uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
    }),
    discogsVideoFactory.youtube({
      description: "Rick Astley - Never Gonna Give You Up (Instrumental)",
      duration: 330,
      title: "Rick Astley - Never Gonna Give You Up (Instrumental)",
      uri: "https://www.youtube.com/watch?v=abc12345678",
    }),
  ],
});

const collectionRelease = releaseFactory.withDisplayDefaults({
  basic_information: basicInformationFactory.build({
    id: RELEASE_ID,
    title: "Never Gonna Give You Up",
    resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
  }),
});

const SHORT_RELEASE_ID = 100002;

const shortReleaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: SHORT_RELEASE_ID,
  tracklist: [
    discogsTrackFactory.build({
      position: "1",
      title: "Short A",
      duration: "2:00",
      type_: "track",
    }),
  ],
  videos: [
    discogsVideoFactory.youtube({
      description: "Short A",
      duration: 120,
      title: "Short A",
      uri: "https://www.youtube.com/watch?v=def98765432",
    }),
  ],
});

const shortCollectionRelease = releaseFactory.withDisplayDefaults({
  basic_information: basicInformationFactory.build({
    id: SHORT_RELEASE_ID,
    title: "Short EP",
    resource_url: `https://api.discogs.com/releases/${SHORT_RELEASE_ID}`,
  }),
});

const similarHouseReleaseDetail =
  discogsReleaseJsonFactory.withTracklistAndVideos({
    id: 100002,
    tracklist: [
      discogsTrackFactory.build({
        position: "A1",
        title: "Similar Track",
        duration: "4:00",
        type_: "track",
      }),
    ],
    videos: [
      discogsVideoFactory.youtube({
        description: "Similar Track",
        duration: 240,
        title: "Similar Track",
        uri: "https://www.youtube.com/watch?v=similar12345",
      }),
    ],
  });

const setupCollectionAndShortReleaseApiMock = () => {
  setupFetchDiscogsReleaseMock(mockApi, releaseDetail, {
    [String(SHORT_RELEASE_ID)]: shortReleaseDetail,
  });
};

const SeedCollectionReleases = ({
  releases,
  collectionPage = 1,
  collectionTotalPages = 1,
  children,
}: {
  releases: DiscogsRelease[];
  collectionPage?: number;
  collectionTotalPages?: number;
  children: ReactNode;
}) => {
  const { dispatchFetchingCollection, dispatchCollection } =
    useCollectionContext();
  const filtersDispatch = useFiltersDispatch();
  const releasesSeedKey = useMemo(
    () => releases.map((release) => String(release.instance_id)).join(","),
    [releases],
  );
  const seededReleasesKeyRef = useRef<string | null>(null);

  if (seededReleasesKeyRef.current !== releasesSeedKey) {
    seededReleasesKeyRef.current = releasesSeedKey;
    filtersDispatch({
      type: FiltersActionTypes.SetAllReleases,
      payload: releases,
    });
  }

  useLayoutEffect(() => {
    dispatchFetchingCollection(false);
    dispatchCollection(
      collectionFactory.build(
        { releases },
        { page: collectionPage, totalPages: collectionTotalPages },
      ),
    );
  }, [
    collectionPage,
    collectionTotalPages,
    dispatchCollection,
    dispatchFetchingCollection,
    releases,
  ]);

  return children;
};

const createWrapper = (
  releases: DiscogsRelease[] = [],
  collectionOptions?: {
    collectionPage?: number;
    collectionTotalPages?: number;
  },
) => {
  return ({ children }: { children: ReactNode }) => (
    <TestProviders
      authInitialState={testAuthenticatedAuthState}
      includeCollectionSync={false}
    >
      <SeedCollectionReleases releases={releases} {...collectionOptions}>
        <ReleasePlaybackProvider>{children}</ReleasePlaybackProvider>
      </SeedCollectionReleases>
    </TestProviders>
  );
};

const createAuthCheckingWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <TestProviders
      authInitialState={{
        ...testAuthenticatedAuthState,
        isCheckingAuth: true,
      }}
      includeCollectionSync={false}
    >
      <SeedCollectionReleases releases={[collectionRelease]}>
        <ReleasePlaybackProvider>{children}</ReleasePlaybackProvider>
      </SeedCollectionReleases>
    </TestProviders>
  );
};

export {
  advanceEmbedWatchdogSyncProbeRecheck,
  advanceFirstSessionEmbedWatchdogFire,
  collectionRelease,
  createAuthCheckingWrapper,
  createWrapper,
  dispatchYoutubeEmbedReady,
  dispatchYoutubeInfoDelivery,
  dispatchYoutubePlayerError,
  dispatchYoutubePlayerState,
  mockApi,
  mockUserPreferencesResponse,
  preferencesApiError,
  RELEASE_ID,
  releaseDetail,
  resolveFirstSessionEmbedWatchdogArmMs,
  resolveFirstSessionEmbedWatchdogArmMsForSlow,
  SeedCollectionReleases,
  SHORT_RELEASE_ID,
  setDocumentVisibilityState,
  setupCollectionAndShortReleaseApiMock,
  shortCollectionRelease,
  shortReleaseDetail,
  similarHouseReleaseDetail,
};
