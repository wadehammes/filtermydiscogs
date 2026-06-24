import * as apiHelpers from "src/api/helpers";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import {
  testAuthenticatedAuthState,
  testUnauthenticatedAuthState,
} from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { ReleaseNotes } from "./ReleaseNotes.component";
import { ReleaseNotesEditorProvider } from "./ReleaseNotesEditor.context";

jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

export type ReleaseNotesRenderProps = {
  release?: DiscogsRelease;
  variant?: "inline" | "displayOnly";
  authenticated?: boolean;
};

export class ReleaseNotesPageObject extends BasePageObject {
  public testId = "fmdReleaseNotes";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();

    mockApiResponse(
      true,
      mockApi.fetchCollectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      new Error("Failed to fetch collection fields"),
    );

    setupDefaultCrateApiMocks(mockApi);
  }

  private releaseNotesElement({
    release = releaseFactory.forNotesEditor(12345, { notes: [] }),
    variant = "inline",
  }: ReleaseNotesRenderProps = {}) {
    const notes = <ReleaseNotes release={release} variant={variant} />;

    if (variant === "displayOnly") {
      return (
        <ReleaseNotesEditorProvider release={release}>
          {notes}
        </ReleaseNotesEditorProvider>
      );
    }

    return notes;
  }

  renderReleaseNotes({
    authenticated = true,
    ...overrides
  }: ReleaseNotesRenderProps = {}): RenderResult {
    return render(this.releaseNotesElement(overrides), {
      authInitialState: authenticated
        ? testAuthenticatedAuthState
        : testUnauthenticatedAuthState,
    });
  }
}
