import type { RenderResult } from "@testing-library/react";
import { api } from "src/api/urls";
import { CollectionSearchCommandSegment } from "src/components/StickyHeaderBar/CollectionSearchCommandSegment.component";
import { BasePageObject } from "src/tests/BasePageObject.po";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { openCollectionCommandPalette } from "src/utils/collectionCommandPaletteBridge";
import { render } from "test-utils";

jest.mock("src/api/urls");

jest.mock("src/utils/collectionCommandPaletteBridge", () => ({
  openCollectionCommandPalette: jest.fn(),
}));

const mockApi = jest.mocked(api);

export const mockOpenCollectionCommandPalette = jest.mocked(
  openCollectionCommandPalette,
);

export class CollectionSearchCommandSegmentPageObject extends BasePageObject {
  public segmentTestId = "fmdCollectionSearchCommandSegment";
  public chipTestId = "fmdCollectionCommandOpenChip";
  mockApi = mockApi;
  mockOpenCollectionCommandPalette = mockOpenCollectionCommandPalette;

  constructor() {
    super();
    this.setupMocks();
  }

  setupMocks(): void {
    jest.resetAllMocks();
    setupDefaultCrateApiMocks(this.mockApi);
    mockApiResponse(
      true,
      this.mockApi.userPreferences,
      userPreferencesFactory.asApiResponse(),
      new Error("Preferences request failed"),
    );
  }

  renderCollectionSearchCommandSegment(): RenderResult {
    return render(<CollectionSearchCommandSegment disabled={false} />, {
      authInitialState: testAuthenticatedAuthState,
    });
  }
}
