import * as apiHelpers from "src/api/helpers";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { ReleasesTable } from "./ReleasesTable.component";

jest.mock("src/api/helpers");

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

const mockAddToCrate = jest.fn();
const mockRemoveFromCrate = jest.fn();
const mockIsInCrate = jest.fn(() => false);
const mockOpenDrawer = jest.fn();

jest.mock("src/context/crate.context", () => ({
  useCrate: () => ({
    addToCrate: mockAddToCrate,
    removeFromCrate: mockRemoveFromCrate,
    isInCrate: mockIsInCrate,
    openDrawer: mockOpenDrawer,
  }),
}));

const mockApi = jest.mocked(apiHelpers);
const apiError = new Error("API request failed");

export type ReleasesTableRenderProps = {
  releases?: DiscogsRelease[];
  onExitRandomMode?: () => void;
  onReleaseClick?: (instanceId: string) => void;
};

export class ReleasesTablePageObject extends BasePageObject {
  public testId = "fmdReleasesTable";
  public onReleaseClick = jest.fn();
  public onExitRandomMode = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    mockFiltersDispatch.mockReset();
    mockIsInCrate.mockReturnValue(false);
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.fetchCollectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
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
