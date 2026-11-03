import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  pageObjectApiError,
  pageObjectMockApi,
} from "src/tests/mocks/pageObjectMockedApi";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupPageObjectAuthenticatedAuthService } from "src/tests/mocks/setupPageObjectAuthenticatedAuthService";
import { wireReleaseCrateActionApiMocks } from "src/tests/mocks/wireReleaseCrateActionApiMocks";
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
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

const mockApi = pageObjectMockApi;

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
      sidePanel: "crates" as const,
      isSidePanelDefaultPending: false,
      packedReleaseCount: 0,
      isUpdatingCrate: false,
      isUpdatingCrateLayout: false,
      isCreatingCrate: false,
      isDeletingCrate: false,
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
    setupPageObjectAuthenticatedAuthService();
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      pageObjectApiError,
    );
    wireReleaseCrateActionApiMocks(mockApi);
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
    return render(
      <ReleasePlaybackTestTree>
        {this.releasesTableElement(overrides)}
      </ReleasePlaybackTestTree>,
      {
        authInitialState: testAuthenticatedAuthState,
        includeCrate: false,
        includeCollectionSync: false,
      },
    );
  }
}
