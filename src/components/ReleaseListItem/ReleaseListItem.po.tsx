import { api } from "src/api/urls";
import {
  checkAuthStatus,
  getUsernameFromCookies,
  parseAuthUrlParams,
} from "src/services/auth.service";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease, ReleaseListItemProps } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { ReleaseListItem } from "./ReleaseListItem.component";

jest.mock("src/api/urls");
jest.mock("src/services/auth.service");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(api);
const mockCheckAuthStatus = jest.mocked(checkAuthStatus);
const mockGetUsernameFromCookies = jest.mocked(getUsernameFromCookies);
const mockParseAuthUrlParams = jest.mocked(parseAuthUrlParams);

const apiError = new Error("API request failed");

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

    mockGetUsernameFromCookies.mockReturnValue("testuser");
    mockCheckAuthStatus.mockResolvedValue(authStatusFactory.authenticated());
    mockParseAuthUrlParams.mockReturnValue({
      authStatus: null,
      errorStatus: null,
    });

    mockApiResponse(
      true,
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos(),
      apiError,
    );

    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );

    mockApiResponse(
      true,
      mockApi.crates,
      cratesResponseFactory.withCrate(this.defaultCrateWithCount),
      apiError,
    );

    mockApiResponse(
      true,
      mockApi.crate,
      crateWithReleasesResponseFactory.empty(this.defaultCrate),
      apiError,
    );

    mockApiResponse(
      true,
      mockApi.addReleaseToCrate,
      crateMutationSuccessFactory.build(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.removeReleaseFromCrate,
      crateMutationSuccessFactory.build(),
      apiError,
    );
  }

  mockCrateContainsRelease(release: DiscogsRelease) {
    mockApiResponse(
      true,
      mockApi.crate,
      crateWithReleasesResponseFactory.withReleases(this.defaultCrate, [
        release,
      ]),
      apiError,
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
