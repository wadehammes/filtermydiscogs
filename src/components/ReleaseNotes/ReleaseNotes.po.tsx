import { api } from "src/api/urls";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import { ReleaseNotesEditorProvider } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
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
import { toast } from "src/utils/toast";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/utils/toast", () => ({
  toast: {
    dismiss: jest.fn(),
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockApi = jest.mocked(api);
const mockToastDismiss = jest.mocked(toast.dismiss);
const mockToastLoading = jest.mocked(toast.loading);
const mockToastSuccess = jest.mocked(toast.success);

export type ReleaseNotesRenderProps = {
  release?: DiscogsRelease;
  variant?: "inline" | "displayOnly" | "modal";
  authenticated?: boolean;
};

export class ReleaseNotesPageObject extends BasePageObject {
  public testId = "fmdReleaseNotes";
  mockApi = mockApi;
  mockToastDismiss = mockToastDismiss;
  mockToastLoading = mockToastLoading;
  mockToastSuccess = mockToastSuccess;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();

    mockApiResponse(
      true,
      this.mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      new Error("Failed to fetch collection fields"),
    );

    setupDefaultCrateApiMocks(this.mockApi);
  }

  private releaseNotesElement({
    release = releaseFactory.forNotesEditor(12345, { notes: [] }),
    variant = "inline",
  }: ReleaseNotesRenderProps = {}) {
    const notes = <ReleaseNotes release={release} variant={variant} />;

    if (variant === "displayOnly" || variant === "modal") {
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
      includeCollectionSync: false,
    });
  }
}
