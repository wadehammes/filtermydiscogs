import { api } from "src/api/urls";
import { ReleaseNotesCardAction } from "src/components/ReleaseNotes/ReleaseNotesCardAction.component";
import { ReleaseNotesEditorProvider } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
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

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const apiError = new Error("Failed to fetch collection fields");

export class ReleaseNotesCardActionPageObject extends BasePageObject {
  public testId = "fmdReleaseNotesCardAction";
  public mockApi = mockApi;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(this.mockApi);
    mockApiResponse(
      true,
      this.mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );
  }

  renderReleaseNotesCardAction(
    release: DiscogsRelease = releaseFactory.withEmptyNotes(),
  ): RenderResult {
    return render(
      <ReleaseNotesEditorProvider release={release}>
        <ReleaseNotesCardAction />
      </ReleaseNotesEditorProvider>,
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );
  }
}
