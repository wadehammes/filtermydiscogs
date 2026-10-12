import { ReleasesTableRowActions } from "src/components/ReleasesTable/ReleasesTableRowActions.component";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { ReleaseOpenPrefetchPageObject } from "src/tests/ReleaseOpenPrefetchPageObject.po";
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");

const apiError = new Error("API request failed");
const DEFAULT_RELEASE_ID = 12345;

export type ReleasesTableRowActionsRenderProps = {
  release?: DiscogsRelease;
  onReleaseClick?: jest.Mock;
};

export class ReleasesTableRowActionsPageObject extends ReleaseOpenPrefetchPageObject {
  public testId = "fmdReleasesTableRowActions";

  constructor() {
    super();
    this.setupReleaseOpenPrefetchMocks(DEFAULT_RELEASE_ID);
    mockApiResponse(
      true,
      this.mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );
  }

  private releasesTableRowActionsElement(
    overrides: ReleasesTableRowActionsRenderProps = {},
  ) {
    const {
      release = releaseFactory.forNotesEditor(DEFAULT_RELEASE_ID, {
        notes: [],
      }),
      onReleaseClick = jest.fn(),
    } = overrides;

    return (
      <ReleasePlaybackTestTree>
        <ReleasesTableRowActions
          release={release}
          onReleaseClick={onReleaseClick}
        />
      </ReleasePlaybackTestTree>
    );
  }

  renderReleasesTableRowActions(
    overrides: ReleasesTableRowActionsRenderProps = {},
  ): RenderResult {
    return render(this.releasesTableRowActionsElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCrate: false,
      includeCollectionSync: false,
    });
  }
}
