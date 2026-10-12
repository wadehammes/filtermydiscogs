import type { ReactNode } from "react";
import { api } from "src/api/urls";
import { ReleaseMiniPlayer } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.component";
import {
  ReleasePlaybackProvider,
  useReleasePlayback,
} from "src/context/releasePlayback.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { userTrackStatsResponseFactory } from "src/tests/factories/UserTrackStatsResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupDefaultTrackStatsApiMock } from "src/tests/mocks/setupDefaultTrackStatsApiMock";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { DiscogsRelease, Release } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import { definedProps } from "src/utils/definedProps";
import { markPlaybackVideoIntroSeen } from "src/utils/playbackVideoIntroStorage";
import { loadAndPlayYoutubeVideo } from "src/utils/releasePlayback";
import { render } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/utils/postYoutubePlayerCommand", () => ({
  postYoutubePlayerCommand: jest.fn(),
  loadAndPlayYoutubeVideo: jest.fn(),
  loadYoutubeVideoById: jest.fn(),
  refreshYoutubeEmbedPlayerLayout: jest.fn(),
}));

const mockApi = jest.mocked(api);
const mockLoadAndPlayYoutubeVideo = jest.mocked(loadAndPlayYoutubeVideo);

const ReleaseMiniPlayerPlaybackStarter = ({
  collectionRelease,
}: {
  collectionRelease: Release;
}) => {
  const { startPlayback } = useReleasePlayback();

  return (
    <button
      type="button"
      onClick={() => {
        startPlayback({
          release: collectionRelease,
          trackPosition: "A",
        });
      }}
    >
      Start playback
    </button>
  );
};

export const RELEASE_MINI_PLAYER_RELEASE_ID = 249504;
export const RELEASE_MINI_PLAYER_INSTANCE_ID = "instance-249504";

const defaultReleaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: RELEASE_MINI_PLAYER_RELEASE_ID,
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

export class ReleaseMiniPlayerPageObject extends BasePageObject {
  public testId = "fmdReleaseMiniPlayer";
  public mockApi = mockApi;
  public mockLoadAndPlayYoutubeVideo = mockLoadAndPlayYoutubeVideo;
  public defaultCrate = crateFactory.defaultTestCrate();
  public defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();
  public collectionRelease = releaseFactory.withDisplayDefaults({
    instance_id: RELEASE_MINI_PLAYER_INSTANCE_ID,
    basic_information: basicInformationFactory.build({
      id: RELEASE_MINI_PLAYER_RELEASE_ID,
      title: "Never Gonna Give You Up",
      resource_url: `https://api.discogs.com/releases/${RELEASE_MINI_PLAYER_RELEASE_ID}`,
    }),
  });
  public releaseDetail = defaultReleaseDetail;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    localStorage.clear();
    markPlaybackVideoIntroSeen();
    setupMockMatchMedia({ desktop: true });
    setupDefaultCrateApiMocks(this.mockApi);
    this.mockDefaultUserPreferences();
    setupFetchDiscogsReleaseMock(this.mockApi, this.releaseDetail);
    setupDefaultTrackStatsApiMock(this.mockApi);
    mockApiResponse(
      true,
      this.mockApi.addReleaseToCrate,
      crateMutationSuccessFactory.build(),
      new Error("Crate API request failed"),
    );
    mockApiResponse(
      true,
      this.mockApi.removeReleaseFromCrate,
      crateMutationSuccessFactory.build(),
      new Error("Crate API request failed"),
    );
    mockApiResponse(
      true,
      this.mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build(),
      new Error("Crate API request failed"),
    );
  }

  mockDefaultUserPreferences(): void {
    mockApiResponse(
      true,
      this.mockApi.userPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      new Error("Preferences API request failed"),
    );
  }

  mockFetchDiscogsRelease(
    defaultDetail: DiscogsReleaseDetail,
    releaseDetailsById: Record<string, DiscogsReleaseDetail> = {},
  ): void {
    setupFetchDiscogsReleaseMock(
      this.mockApi,
      defaultDetail,
      releaseDetailsById,
    );
  }

  mockTrackStatsForOverride(trackKey: string, youtubeId: string): void {
    mockApiResponse(
      true,
      this.mockApi.fetchTrackStats,
      userTrackStatsResponseFactory.build({
        stats: {
          [trackKey]: {
            play_count: 0,
            listen_count: 0,
            youtube_id: youtubeId,
          },
        },
      }),
      new Error("Track stats API request failed"),
    );
  }

  mockReleaseAlreadyInCrate(release: DiscogsRelease): void {
    mockApiResponse(
      true,
      this.mockApi.crate,
      crateWithReleasesResponseFactory.withReleases(this.defaultCrate, [
        release,
      ]),
      new Error("Crate API request failed"),
    );
    mockApiResponse(
      true,
      this.mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build({
        crateIds: [this.defaultCrateWithCount.id],
      }),
      new Error("Crate API request failed"),
    );
  }

  mockDiscogsReleaseWithoutVideos(): void {
    this.mockFetchDiscogsRelease(
      discogsReleaseJsonFactory.withTracklistAndVideos({
        id: RELEASE_MINI_PLAYER_RELEASE_ID,
        videos: [],
      }),
    );
  }

  createWrapper(onReleaseClick?: (instanceId: string) => void) {
    return ({ children }: { children: ReactNode }) => (
      <TestProviders
        authInitialState={testAuthenticatedAuthState}
        includeCollectionSync={false}
      >
        <ReleasePlaybackProvider>
          {children}
          <ReleaseMiniPlayer {...definedProps({ onReleaseClick })} />
        </ReleasePlaybackProvider>
      </TestProviders>
    );
  }

  PlaybackStarterElement() {
    const collectionRelease = this.collectionRelease;

    return function PlaybackStarter() {
      return (
        <ReleaseMiniPlayerPlaybackStarter
          collectionRelease={collectionRelease}
        />
      );
    };
  }

  renderWithPlaybackStarter(options?: {
    onReleaseClick?: (instanceId: string) => void;
  }) {
    const PlaybackStarter = this.PlaybackStarterElement();

    return render(<PlaybackStarter />, {
      wrapper: this.createWrapper(options?.onReleaseClick),
    });
  }
}
