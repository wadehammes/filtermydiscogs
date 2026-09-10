import { api } from "src/api/urls";
import { ReleaseCard } from "src/components/ReleaseCard/ReleaseCard.component";
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
import { authUrlParamsFactory } from "src/tests/factories/AuthUrlParams.factory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { createCrateResponseFactory } from "src/tests/factories/CreateCrateResponse.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease, ReleaseCardProps } from "src/types";
import { toast } from "src/utils/toast";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/utils/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

jest.mock("src/api/urls");
jest.mock("src/services/auth.service");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(api);
const mockToastSuccess = jest.mocked(toast.success);
const mockToastError = jest.mocked(toast.error);
const mockCheckAuthStatus = jest.mocked(checkAuthStatus);
const mockGetUsernameFromCookies = jest.mocked(getUsernameFromCookies);
const mockParseAuthUrlParams = jest.mocked(parseAuthUrlParams);

const apiError = new Error("API request failed");

export type ReleaseCardRenderProps = Partial<
  Omit<ReleaseCardProps, "release">
> & {
  release?: DiscogsRelease;
};

export class ReleaseCardPageObject extends BasePageObject {
  public testId = "fmdReleaseCard";
  public mockApi = mockApi.discogsRelease;
  public mockApiHelpers = mockApi;
  mockToastSuccess = mockToastSuccess;
  mockToastError = mockToastError;
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
    mockParseAuthUrlParams.mockReturnValue(authUrlParamsFactory.empty());

    mockApiResponse(
      true,
      this.mockApiHelpers.userPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      apiError,
    );

    mockApiResponse(
      true,
      this.mockApiHelpers.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos(),
      apiError,
    );

    mockApiResponse(
      true,
      this.mockApiHelpers.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );

    mockApiResponse(
      true,
      this.mockApiHelpers.crates,
      cratesResponseFactory.withCrate(this.defaultCrateWithCount),
      apiError,
    );

    mockApiResponse(
      true,
      this.mockApiHelpers.crate,
      crateWithReleasesResponseFactory.empty(this.defaultCrate),
      apiError,
    );

    mockApiResponse(
      true,
      this.mockApiHelpers.addReleaseToCrate,
      crateMutationSuccessFactory.build(),
      apiError,
    );
    mockApiResponse(
      true,
      this.mockApiHelpers.removeReleaseFromCrate,
      crateMutationSuccessFactory.build(),
      apiError,
    );

    mockApiResponse(
      true,
      this.mockApiHelpers.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build(),
      apiError,
    );

    mockApiResponse(
      true,
      this.mockApiHelpers.setReleaseCrateMembership,
      { success: true, crateIds: [] },
      apiError,
    );

    mockApiResponse(
      true,
      this.mockApiHelpers.createCrate,
      createCrateResponseFactory.forCrate(
        crateFactory.build({ id: "new-crate-id", name: "New Crate" }),
      ),
      apiError,
    );

    mockApiResponse(
      true,
      this.mockApiHelpers.updateCrate,
      createCrateResponseFactory.forCrate(
        crateFactory.build({
          id: "new-crate-id",
          name: "New Crate",
          is_default: true,
        }),
      ),
      apiError,
    );
  }

  private activeCrateReleaseIds = new Set<string>();

  mockReleaseCrateMembership(crateIds: string[]) {
    mockApiResponse(
      true,
      this.mockApiHelpers.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build({ crateIds }),
      apiError,
    );
  }

  mockCrateContainsRelease(release: DiscogsRelease) {
    mockApiResponse(
      true,
      this.mockApiHelpers.crate,
      crateWithReleasesResponseFactory.withReleases(this.defaultCrate, [
        release,
      ]),
      apiError,
    );
    this.activeCrateReleaseIds.add(String(release.instance_id));
    this.mockReleaseCrateMembership([this.defaultCrate.id]);
  }

  protected resolveInActiveCrate(
    release: DiscogsRelease,
    override?: boolean,
  ): boolean {
    if (override !== undefined) {
      return override;
    }

    return this.activeCrateReleaseIds.has(String(release.instance_id));
  }

  mockMultipleCrates(crates: (typeof this.defaultCrateWithCount)[]) {
    mockApiResponse(
      true,
      this.mockApiHelpers.crates,
      cratesResponseFactory.withCrates(crates),
      apiError,
    );
  }

  private releaseCardElement(overrides: ReleaseCardRenderProps = {}) {
    const { release, inActiveCrate, ...rest } = overrides;
    const resolvedRelease = release ?? releaseFactory.withDisplayDefaults();

    return (
      <ReleasePlaybackTestTree>
        <ReleaseCard
          release={resolvedRelease}
          inActiveCrate={this.resolveInActiveCrate(
            resolvedRelease,
            inActiveCrate,
          )}
          {...rest}
        />
      </ReleasePlaybackTestTree>
    );
  }

  renderReleaseCard(overrides: ReleaseCardRenderProps = {}): RenderResult {
    return render(this.releaseCardElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
