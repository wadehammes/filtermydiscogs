import { api } from "src/api/urls";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { PublicReleaseModalBody } from "./PublicReleaseModalBody.component";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");
const RELEASE_ID = 249504;

export type PublicReleaseModalBodyRenderProps = {
  release?: DiscogsRelease;
  isOpen?: boolean;
};

export class PublicReleaseModalBodyPageObject extends BasePageObject {
  public testId = "fmdPublicReleaseModalBody";
  public mockApi = mockApi;
  public defaultRelease = releaseFactory.withTitle(
    "Never Gonna Give You Up",
    RELEASE_ID,
  );

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: RELEASE_ID }),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.userPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      apiError,
    );
  }

  private publicReleaseModalBodyElement(
    overrides: PublicReleaseModalBodyRenderProps = {},
  ) {
    const { release = this.defaultRelease, isOpen = true } = overrides;

    return (
      <ReleasePlaybackProvider>
        <PublicReleaseModalBody release={release} isOpen={isOpen} />
      </ReleasePlaybackProvider>
    );
  }

  renderPublicReleaseModalBody(
    overrides: PublicReleaseModalBodyRenderProps = {},
  ): RenderResult {
    return render(this.publicReleaseModalBodyElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }

  rerenderPublicReleaseModalBody(
    view: RenderResult,
    overrides: PublicReleaseModalBodyRenderProps = {},
  ): void {
    view.rerender(this.publicReleaseModalBodyElement(overrides));
  }
}
