import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { createCrateResponseFactory } from "src/tests/factories/CreateCrateResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  pageObjectApiError,
  pageObjectMockApi,
} from "src/tests/mocks/pageObjectMockedApi";
import { setupPageObjectAuthenticatedAuthService } from "src/tests/mocks/setupPageObjectAuthenticatedAuthService";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { RenderResult } from "test-utils";
import { render, screen, waitFor } from "test-utils";
import { CrateSelector } from "./CrateSelector.component";

jest.mock("src/api/urls");
jest.mock("src/services/auth.service");

const mockApi = pageObjectMockApi;

export type CrateSelectorRenderProps = {
  allowCreate?: boolean;
  className?: string;
  onNavigate?: (crateId: string) => void;
};

export class CrateSelectorPageObject extends BasePageObject {
  public testId = "fmdCrateSelector";
  public mockApiHelpers = mockApi;
  public crates = crateWithCountFactory.defaultCrateSelectorCrates();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    localStorage.clear();

    setupPageObjectAuthenticatedAuthService();

    mockApiResponse(
      true,
      mockApi.crates,
      cratesResponseFactory.withCrates(this.crates),
      pageObjectApiError,
    );

    mockApi.crate.mockImplementation(async (crateId: string) => {
      const crate = this.crates.find((entry) => entry.id === crateId);
      if (!crate) {
        throw new Error(`Crate not found: ${crateId}`);
      }

      const { releaseCount: _releaseCount, ...crateWithoutCount } = crate;
      return crateWithReleasesResponseFactory.empty(crateWithoutCount);
    });

    mockApiResponse(
      true,
      mockApi.createCrate,
      createCrateResponseFactory.named("My New Crate"),
      pageObjectApiError,
    );

    mockApiResponse(
      true,
      mockApi.updateCrate,
      createCrateResponseFactory.named("Renamed Crate", { id: "1" }),
      pageObjectApiError,
    );

    mockApiResponse(
      true,
      mockApi.syncCrates,
      crateMutationSuccessFactory.sync(0),
      pageObjectApiError,
    );
  }

  mockLoading() {
    mockApi.crates.mockImplementation(() => new Promise(() => {}));
  }

  mockSlowCreateCrate() {
    mockApi.createCrate.mockImplementation(() => new Promise(() => {}));
  }

  mockCreateCrateError() {
    mockApiResponse(
      false,
      mockApi.createCrate,
      createCrateResponseFactory.build(),
      new Error("Failed to create crate"),
    );
  }

  mockCreateCrateResponse(crateName: string, crateId = "new-crate") {
    mockApiResponse(
      true,
      mockApi.createCrate,
      createCrateResponseFactory.named(crateName, { id: crateId }),
      pageObjectApiError,
    );
  }

  mockCrates(crates: typeof this.crates) {
    this.crates = crates;
    mockApiResponse(
      true,
      mockApi.crates,
      cratesResponseFactory.withCrates(crates),
      pageObjectApiError,
    );
  }

  mockRenameCrateResponse(crateName: string, crateId = "1") {
    mockApiResponse(
      true,
      mockApi.updateCrate,
      createCrateResponseFactory.named(crateName, { id: crateId }),
      pageObjectApiError,
    );
  }

  async waitUntilLoaded() {
    await waitFor(() => {
      if (screen.queryByText("Loading crates...")) {
        throw new Error("Crate selector is still loading");
      }
    });
  }

  renderCrateSelector(overrides: CrateSelectorRenderProps = {}): RenderResult {
    return render(<CrateSelector {...overrides} />, {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
