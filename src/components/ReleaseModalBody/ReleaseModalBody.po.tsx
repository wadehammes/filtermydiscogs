import { ApiFetchError } from "src/api/apiFetchError";
import { api } from "src/api/urls";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import {
  mockApiResponse,
  mockPendingApiResponse,
} from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { ReleaseModalBody } from "./ReleaseModalBody.component";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");
const RELEASE_ID = 249504;

export type ReleaseModalBodyRenderProps = {
  release?: DiscogsRelease;
  isOpen?: boolean;
};

export class ReleaseModalBodyPageObject extends BasePageObject {
  public testId = "fmdReleaseModalBody";
  public mockApi = mockApi;
  public defaultRelease = releaseFactory.withTitle(
    "Never Gonna Give You Up",
    RELEASE_ID,
  );

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  defaultReleaseDetail(): DiscogsReleaseDetail {
    return discogsReleaseJsonFactory.withTracklistAndVideos({ id: RELEASE_ID });
  }

  mockPendingDiscogsRelease(): (releaseDetail?: DiscogsReleaseDetail) => void {
    const resolve = mockPendingApiResponse(mockApi.discogsRelease);

    return (releaseDetail = this.defaultReleaseDetail()) => {
      resolve(releaseDetail);
    };
  }

  mockDiscogsReleaseFetchError(status: number, message?: string): void {
    mockApiResponse(
      false,
      mockApi.discogsRelease,
      this.defaultReleaseDetail(),
      new ApiFetchError(status, message),
    );
  }

  mockDiscogsReleaseById(
    defaultReleaseDetail: DiscogsReleaseDetail,
    releaseDetailsById: Record<string, DiscogsReleaseDetail> = {},
  ): void {
    setupFetchDiscogsReleaseMock(
      mockApi,
      defaultReleaseDetail,
      releaseDetailsById,
    );
  }

  mockPendingUpdateCollectionNote(): (
    value: Awaited<ReturnType<typeof mockApi.updateCollectionNote>>,
  ) => void {
    return mockPendingApiResponse(mockApi.updateCollectionNote);
  }

  setupMocks() {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: RELEASE_ID }),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.userPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      apiError,
    );
  }

  private releaseModalBodyElement(overrides: ReleaseModalBodyRenderProps = {}) {
    const { release = this.defaultRelease, isOpen = true } = overrides;

    return (
      <ReleasePlaybackProvider>
        <ReleaseModalBody release={release} isOpen={isOpen} />
      </ReleasePlaybackProvider>
    );
  }

  renderReleaseModalBody(
    overrides: ReleaseModalBodyRenderProps = {},
  ): RenderResult {
    return render(this.releaseModalBodyElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }

  rerenderReleaseModalBody(
    view: RenderResult,
    overrides: ReleaseModalBodyRenderProps = {},
  ): void {
    view.rerender(this.releaseModalBodyElement(overrides));
  }
}
