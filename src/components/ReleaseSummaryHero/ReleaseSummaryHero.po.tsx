import { api } from "src/api/urls";
import { ReleaseSummaryHero } from "src/components/ReleaseSummaryHero/ReleaseSummaryHero.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

const mockUseMediaQuery = jest.fn(() => false);

jest.mock("src/hooks/useMediaQuery.hook", () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

jest.mock("src/api/urls");

jest.mock("src/hooks/useFilterAtoms.hook", () => ({
  useSelectedFormats: () => [],
  useSelectedStyles: () => [],
  useFiltersDispatch: () => jest.fn(),
  useAllReleases: () => [],
}));

jest.mock("src/hooks/usePillClickHandler.hook", () => ({
  usePillClickHandler: () => jest.fn(),
}));

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");

export const RELEASE_SUMMARY_HERO_RELEASE_ID = 249504;

export type ReleaseSummaryHeroRenderProps = {
  release: DiscogsRelease;
  includeCollectionSync?: boolean;
  authenticated?: boolean;
};

export class ReleaseSummaryHeroPageObject extends BasePageObject {
  public testId = "fmdReleaseSummaryHero";
  public mockApi = mockApi;
  public mockUseMediaQuery = mockUseMediaQuery;
  public defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    this.mockUseMediaQuery.mockReturnValue(false);
    setupDefaultCrateApiMocks(this.mockApi);
    mockApiResponse(
      true,
      this.mockApi.addReleaseToCrate,
      crateMutationSuccessFactory.build(),
      apiError,
    );
    mockApiResponse(
      true,
      this.mockApi.removeReleaseFromCrate,
      crateMutationSuccessFactory.build(),
      apiError,
    );
    mockApiResponse(
      true,
      this.mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build(),
      apiError,
    );
    this.mockReleaseDetail();
  }

  mockReleaseDetail(
    attributes: Parameters<
      typeof discogsReleaseJsonFactory.withTracklistAndVideos
    >[0] = {},
  ): void {
    mockApiResponse(
      true,
      this.mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({
        id: RELEASE_SUMMARY_HERO_RELEASE_ID,
        ...attributes,
      }),
      apiError,
    );
  }

  mockReleaseAlreadyInCrate(release: DiscogsRelease): void {
    const defaultCrate = crateFactory.defaultTestCrate();

    mockApiResponse(
      true,
      this.mockApi.crate,
      crateWithReleasesResponseFactory.withReleases(defaultCrate, [release]),
      apiError,
    );
    mockApiResponse(
      true,
      this.mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build({
        crateIds: [this.defaultCrateWithCount.id],
      }),
      apiError,
    );
  }

  mockUpdateReleaseRating(rating: number): void {
    mockApiResponse(
      true,
      this.mockApi.updateReleaseRating,
      {
        username: "testuser",
        release_id: RELEASE_SUMMARY_HERO_RELEASE_ID,
        rating,
      },
      apiError,
    );
  }

  mockDiscogsCollectionPending(): void {
    this.mockApi.discogsCollection.mockImplementation(
      () => new Promise(() => {}),
    );
  }

  mockDiscogsReleaseImplementation(
    detail:
      | DiscogsReleaseDetail
      | ((releaseId: string) => Promise<DiscogsReleaseDetail>),
  ): void {
    if (typeof detail === "function") {
      this.mockApi.discogsRelease.mockImplementation(detail);
      return;
    }

    this.mockApi.discogsRelease.mockImplementation(() =>
      Promise.resolve(detail),
    );
  }

  communityReleaseDetail(count: number): DiscogsReleaseDetail {
    return discogsReleaseJsonFactory.withTracklistAndVideos({
      id: RELEASE_SUMMARY_HERO_RELEASE_ID,
      community: {
        rating: {
          average: 5,
          count,
        },
      },
    });
  }

  renderReleaseSummaryHero(
    overrides: ReleaseSummaryHeroRenderProps,
  ): RenderResult {
    const {
      release,
      includeCollectionSync = false,
      authenticated = true,
    } = overrides;

    return render(<ReleaseSummaryHero release={release} />, {
      ...(authenticated
        ? { authInitialState: testAuthenticatedAuthState }
        : {}),
      includeCollectionSync,
    });
  }
}
