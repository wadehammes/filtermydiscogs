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
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { CrateWithCount } from "src/types/crate.types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import CrateDetailClient from "./CrateDetailClient.component";
import CratesClient from "./CratesClient.component";

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

const defaultHubCrates = (): CrateWithCount[] => [
  crateWithCountFactory.build({
    id: "crate-a",
    name: "Weekend Set",
    is_default: true,
    private: true,
    releaseCount: 4,
    previewThumbs: [
      "https://example.com/a1.jpg",
      "https://example.com/a2.jpg",
      "https://example.com/a3.jpg",
    ],
  }),
  crateWithCountFactory.build({
    id: "crate-b",
    name: "Deep Cuts",
    is_default: false,
    releaseCount: 2,
    private: false,
    packed_enabled: true,
    previewThumbs: ["https://example.com/b1.jpg", "https://example.com/b2.jpg"],
  }),
];

export class CratesClientPageObject extends BasePageObject {
  readonly testId = "fmdCratesClient";
  readonly detailTestId = "fmdCrateDetailClient";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  setupMocks(crates: CrateWithCount[] = defaultHubCrates()) {
    jest.clearAllMocks();
    setupMockMatchMedia({ desktop: true });

    mockGetUsernameFromCookies.mockReturnValue("testuser");
    mockCheckAuthStatus.mockResolvedValue({
      isAuthenticated: true,
      username: "testuser",
      userId: "123",
      reconnectUsername: null,
      rateLimited: false,
    });
    mockParseAuthUrlParams.mockReturnValue({
      authStatus: null,
      errorStatus: null,
    });

    mockApiResponse(
      true,
      mockApi.crates,
      cratesResponseFactory.withCrates(crates),
      apiError,
    );

    mockApi.crate.mockImplementation(async (crateId: string) => {
      const crateSummary = crates.find((crate) => crate.id === crateId);
      if (!crateSummary) {
        throw new Error(`Crate not found: ${crateId}`);
      }

      const { releaseCount: _releaseCount, ...crateWithoutCount } =
        crateSummary;

      return crateWithReleasesResponseFactory.empty(crateWithoutCount);
    });

    mockApiResponse(
      true,
      mockApi.discogsCollection,
      collectionFactory.empty(),
      apiError,
    );
  }

  renderCratesHub(crates = defaultHubCrates()): RenderResult {
    this.setupMocks(crates);

    return render(
      <ReleasePlaybackTestTree>
        <CratesClient />
      </ReleasePlaybackTestTree>,
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );
  }

  renderCrateDetail(
    crateId = "crate-a",
    crateName = "Weekend Set",
  ): RenderResult {
    const crate = crateWithCountFactory.build({
      id: crateId,
      name: crateName,
      is_default: true,
      releaseCount: 0,
    });

    this.setupMocks([crate]);

    return render(
      <ReleasePlaybackTestTree>
        <CrateDetailClient crateId={crateId} />
      </ReleasePlaybackTestTree>,
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );
  }
}
