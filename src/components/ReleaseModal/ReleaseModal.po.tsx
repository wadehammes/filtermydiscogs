import * as apiHelpers from "src/api/helpers";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { ReleaseModal } from "./ReleaseModal.component";

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

jest.mock("src/hooks/useMediaQuery.hook", () => ({
  useMediaQuery: () => false,
}));

const mockApi = jest.mocked(apiHelpers);
const apiError = new Error("API request failed");
const RELEASE_ID = 249504;

export type ReleaseModalRenderProps = {
  isOpen?: boolean;
  release?: DiscogsRelease | null;
  onClose?: () => void;
};

export class ReleaseModalPageObject extends BasePageObject {
  public testId = "fmdReleaseModal";
  public defaultRelease = releaseFactory.withTitle(
    "Never Gonna Give You Up",
    RELEASE_ID,
  );
  public onClose = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    mockFiltersDispatch.mockReset();

    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.fetchCollectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.fetchDiscogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: RELEASE_ID }),
      apiError,
    );
  }

  private releaseModalElement(overrides: ReleaseModalRenderProps = {}) {
    const {
      isOpen = true,
      release = this.defaultRelease,
      onClose,
      ...rest
    } = overrides;

    return (
      <ReleasePlaybackProvider>
        <ReleaseModal
          isOpen={isOpen}
          release={release}
          onClose={onClose ?? this.onClose}
          {...rest}
        />
      </ReleasePlaybackProvider>
    );
  }

  renderReleaseModal(overrides: ReleaseModalRenderProps = {}): RenderResult {
    return render(this.releaseModalElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
    });
  }
}
