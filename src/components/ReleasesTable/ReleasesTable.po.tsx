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
import { authUrlParamsFactory } from "src/tests/factories/AuthUrlParams.factory";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { ReleasesTable } from "./ReleasesTable.component";

jest.mock("src/api/urls");
jest.mock("src/services/auth.service");

jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

export const mockFiltersDispatch = jest.fn();

jest.mock("src/hooks/useFilterAtoms.hook", () => ({
  useFiltersDispatch: () => mockFiltersDispatch,
  useAllReleases: () => [],
  useSelectedFormats: () => [],
  useSelectedStyles: () => [],
}));

jest.mock("src/hooks/usePillClickHandler.hook", () => ({
  usePillClickHandler: () => jest.fn(),
}));

const mockApi = jest.mocked(api);
const mockCheckAuthStatus = jest.mocked(checkAuthStatus);
const mockGetUsernameFromCookies = jest.mocked(getUsernameFromCookies);
const mockParseAuthUrlParams = jest.mocked(parseAuthUrlParams);
const apiError = new Error("API request failed");

const defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();
const mockActiveCrateInstanceIds = new Set<string>();
const mockAddReleaseToCrate = jest.fn();
const mockRemoveReleaseFromCrate = jest.fn();
const mockSetReleaseCrateMembership = jest.fn();
const mockCreateCrate = jest.fn(async () => null);

jest.mock("src/context/crate.context", () => {
  const actual = jest.requireActual<typeof import("src/context/crate.context")>(
    "src/context/crate.context",
  );

  return {
    ...actual,
    useCrateState: () => ({
      crates: [defaultCrateWithCount],
      activeCrateId: defaultCrateWithCount.id,
      activeCrateInstanceIds: mockActiveCrateInstanceIds,
      selectedReleases: [],
      layoutItems: [],
      isLoading: false,
      isPendingCrate: false,
      isLoadingCrate: false,
      isFetchingCrate: false,
      isDrawerOpen: false,
      packedReleaseCount: 0,
      isUpdatingCrate: false,
      isCreatingCrate: false,
    }),
    useCrateActions: () => ({
      addReleaseToCrate: mockAddReleaseToCrate,
      removeReleaseFromCrate: mockRemoveReleaseFromCrate,
      setReleaseCrateMembership: mockSetReleaseCrateMembership,
      createCrate: mockCreateCrate,
    }),
  };
});

export type ReleasesTableRenderProps = {
  releases?: DiscogsRelease[];
  onExitRandomMode?: () => void;
  onReleaseClick?: (instanceId: string) => void;
};

export class ReleasesTablePageObject extends BasePageObject {
  public testId = "fmdReleasesTable";
  public onReleaseClick = jest.fn();
  public onExitRandomMode = jest.fn();
  public mockApiHelpers = mockApi;
  public mockCrateHelpers = {
    addReleaseToCrate: mockAddReleaseToCrate,
    removeReleaseFromCrate: mockRemoveReleaseFromCrate,
    activeCrateInstanceIds: mockActiveCrateInstanceIds,
  };

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    mockFiltersDispatch.mockReset();
    mockActiveCrateInstanceIds.clear();
    mockGetUsernameFromCookies.mockReturnValue("testuser");
    mockCheckAuthStatus.mockResolvedValue(authStatusFactory.authenticated());
    mockParseAuthUrlParams.mockReturnValue(authUrlParamsFactory.empty());
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
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
    mockApiResponse(
      true,
      mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build(),
      apiError,
    );
  }

  resetCrateMocks() {
    this.setupMocks();
  }

  private releasesTableElement(overrides: ReleasesTableRenderProps = {}) {
    const {
      releases = releaseFactory.buildList(2),
      onExitRandomMode,
      onReleaseClick,
    } = overrides;

    return (
      <ReleasesTable
        releases={releases}
        onExitRandomMode={onExitRandomMode ?? this.onExitRandomMode}
        onReleaseClick={onReleaseClick ?? this.onReleaseClick}
      />
    );
  }

  renderReleasesTable(overrides: ReleasesTableRenderProps = {}): RenderResult {
    return render(this.releasesTableElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCrate: false,
      includeCollectionSync: false,
    });
  }
}
