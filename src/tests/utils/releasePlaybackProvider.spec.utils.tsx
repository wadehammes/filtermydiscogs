import type { ReactNode } from "react";
import { useLayoutEffect, useMemo, useRef } from "react";
import { api } from "src/api/urls";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import { useFiltersDispatch } from "src/hooks/useFilterAtoms.hook";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import {
  collectionRelease,
  playbackSpecDualReleaseApiMap,
  releaseDetail,
} from "src/tests/fixtures/releasePlaybackProvider.spec.fixtures";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { DiscogsRelease } from "src/types";

const mockApi = jest.mocked(api);
const preferencesApiError = new Error("Preferences API request failed");

export const setDocumentVisibilityState = (
  state: DocumentVisibilityState,
) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
};

export const dispatchYoutubePlayerState = ({
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

export const dispatchYoutubeInfoDelivery = ({
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

export const dispatchYoutubePlayerError = ({
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

export const mockUserPreferencesResponse = (
  preferences = userPreferencesFactory.defaults(),
) => {
  mockApiResponse(
    true,
    mockApi.userPreferences,
    { preferences },
    preferencesApiError,
  );
};

export const setupCollectionAndShortReleaseApiMock = () => {
  setupFetchDiscogsReleaseMock(mockApi, releaseDetail, {
    ...playbackSpecDualReleaseApiMap,
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

export const createWrapper = (
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

export const createAuthCheckingWrapper = () => {
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
