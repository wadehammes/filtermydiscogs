import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  pageObjectApiError,
  pageObjectMockApi,
} from "src/tests/mocks/pageObjectMockedApi";
import { setupPageObjectAuthenticatedAuthService } from "src/tests/mocks/setupPageObjectAuthenticatedAuthService";
import { wireReleaseCrateActionApiMocks } from "src/tests/mocks/wireReleaseCrateActionApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease, ReleaseListItemProps } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { ReleaseListItem } from "./ReleaseListItem.component";

jest.mock("src/api/urls");
jest.mock("src/services/auth.service");
jest.mock("src/analytics/analytics");

const mockApi = pageObjectMockApi;

export type ReleaseListItemRenderProps = Partial<
  Omit<ReleaseListItemProps, "release">
> & {
  release?: DiscogsRelease;
};

export class ReleaseListItemPageObject extends BasePageObject {
  public testId = "fmdReleaseListItem";
  public mockApiHelpers = mockApi;
  public defaultCrate = crateFactory.defaultTestCrate();
  public defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    setupPageObjectAuthenticatedAuthService();

    mockApiResponse(
      true,
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos(),
      pageObjectApiError,
    );

    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      pageObjectApiError,
    );

    mockApiResponse(
      true,
      mockApi.crates,
      cratesResponseFactory.withCrate(this.defaultCrateWithCount),
      pageObjectApiError,
    );

    mockApiResponse(
      true,
      mockApi.crate,
      crateWithReleasesResponseFactory.empty(this.defaultCrate),
      pageObjectApiError,
    );

    wireReleaseCrateActionApiMocks(mockApi);
  }

  mockCrateContainsRelease(release: DiscogsRelease) {
    mockApiResponse(
      true,
      mockApi.crate,
      crateWithReleasesResponseFactory.withReleases(this.defaultCrate, [
        release,
      ]),
      pageObjectApiError,
    );
  }

  private releaseListItemElement(overrides: ReleaseListItemRenderProps = {}) {
    const { release, ...rest } = overrides;

    return (
      <ReleaseListItem
        release={release ?? releaseFactory.withDisplayDefaults()}
        {...rest}
      />
    );
  }

  renderReleaseListItem(
    overrides: ReleaseListItemRenderProps = {},
  ): RenderResult {
    return render(this.releaseListItemElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
