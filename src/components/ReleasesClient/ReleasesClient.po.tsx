import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  pageObjectApiError,
  pageObjectMockApi,
} from "src/tests/mocks/pageObjectMockedApi";
import { bootstrapAuthenticatedDesktopPageObject } from "src/tests/mocks/setupAuthenticatedDesktopPageObjectMocks";
import { AppNavigationTestRoot } from "src/tests/mocks/setupMockAppNavigation.mock";
import { wireDefaultUserPreferencesPageObjectMocks } from "src/tests/mocks/setupSettingsClientPageObjectMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import ReleasesClient from "./ReleasesClient.component";

jest.mock("src/api/urls");
jest.mock("src/services/auth.service");
jest.mock("src/analytics/analytics");

const mockApi = pageObjectMockApi;
const RELEASE_ID = 249504;

export class ReleasesClientPageObject extends BasePageObject {
  public modalTestId = "fmdReleaseModal";
  public cardTestId = "fmdReleaseCard";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    bootstrapAuthenticatedDesktopPageObject();
    wireDefaultUserPreferencesPageObjectMocks();
    this.mockCollectionWithReleaseCount(2);
    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      pageObjectApiError,
    );
    mockApiResponse(
      true,
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: RELEASE_ID }),
      pageObjectApiError,
    );
  }

  mockCollectionWithReleaseCount(releaseCount: number) {
    const releases = releaseFactory.buildList(releaseCount);
    const page = collectionFactory.build(
      { releases },
      { page: 1, totalPages: 1, releaseCount: releases.length },
    );
    page.pagination.urls.next = "";

    mockApiResponse(true, mockApi.discogsCollection, page, pageObjectApiError);
  }

  renderReleasesClientUi(initialUrl = "/releases") {
    return (
      <AppNavigationTestRoot initialUrl={initialUrl}>
        <ReleasePlaybackProvider>
          <ReleasesClient />
        </ReleasePlaybackProvider>
      </AppNavigationTestRoot>
    );
  }

  renderReleasesClient(initialUrl = "/releases"): RenderResult {
    return render(this.renderReleasesClientUi(initialUrl), {
      authInitialState: testAuthenticatedAuthState,
    });
  }
}
