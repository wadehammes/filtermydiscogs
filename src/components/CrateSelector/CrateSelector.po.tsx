import * as apiHelpers from "src/api/helpers";
import {
  checkAuthStatus,
  getUsernameFromCookies,
  parseAuthUrlParams,
} from "src/services/auth.service";
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
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { RenderResult } from "test-utils";
import { render, screen, waitFor } from "test-utils";
import { CrateSelector } from "./CrateSelector.component";

jest.mock("src/api/helpers");
jest.mock("src/services/auth.service");

const mockApi = jest.mocked(apiHelpers);
const mockCheckAuthStatus = jest.mocked(checkAuthStatus);
const mockGetUsernameFromCookies = jest.mocked(getUsernameFromCookies);
const mockParseAuthUrlParams = jest.mocked(parseAuthUrlParams);

const apiError = new Error("API request failed");

export type CrateSelectorRenderProps = {
  className?: string;
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

    mockGetUsernameFromCookies.mockReturnValue("testuser");
    mockCheckAuthStatus.mockResolvedValue({
      isAuthenticated: true,
      username: "testuser",
      userId: "123",
      rateLimited: false,
    });
    mockParseAuthUrlParams.mockReturnValue({
      authStatus: null,
      errorStatus: null,
    });

    mockApiResponse(
      true,
      mockApi.fetchCrates,
      cratesResponseFactory.withCrates(this.crates),
      apiError,
    );

    mockApi.fetchCrate.mockImplementation(async (crateId: string) => {
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
      apiError,
    );

    mockApiResponse(
      true,
      mockApi.updateCrate,
      createCrateResponseFactory.named("Renamed Crate", { id: "1" }),
      apiError,
    );

    mockApiResponse(
      true,
      mockApi.syncCrates,
      crateMutationSuccessFactory.sync(0),
      apiError,
    );
  }

  mockLoading() {
    mockApi.fetchCrates.mockImplementation(() => new Promise(() => {}));
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
      apiError,
    );
  }

  mockRenameCrateResponse(crateName: string, crateId = "1") {
    mockApiResponse(
      true,
      mockApi.updateCrate,
      createCrateResponseFactory.named(crateName, { id: crateId }),
      apiError,
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
    });
  }
}
