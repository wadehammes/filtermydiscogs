import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { pageObjectMockApi } from "src/tests/mocks/pageObjectMockedApi";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupPageObjectAuthenticatedAuthService } from "src/tests/mocks/setupPageObjectAuthenticatedAuthService";

export const bootstrapAuthenticatedDesktopPageObject = (): void => {
  jest.clearAllMocks();
  setupMockMatchMedia({ desktop: true });
  setupPageObjectAuthenticatedAuthService();
  setupDefaultCrateApiMocks(pageObjectMockApi);
};
