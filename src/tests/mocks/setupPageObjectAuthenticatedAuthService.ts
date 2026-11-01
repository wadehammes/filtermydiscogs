import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import { authUrlParamsFactory } from "src/tests/factories/AuthUrlParams.factory";
import {
  pageObjectMockCheckAuthStatus,
  pageObjectMockGetUsernameFromCookies,
  pageObjectMockParseAuthUrlParams,
} from "src/tests/mocks/pageObjectMockedApi";

export const setupPageObjectAuthenticatedAuthService = (): void => {
  pageObjectMockGetUsernameFromCookies.mockReturnValue("testuser");
  pageObjectMockCheckAuthStatus.mockResolvedValue(
    authStatusFactory.authenticated(),
  );
  pageObjectMockParseAuthUrlParams.mockReturnValue(
    authUrlParamsFactory.empty(),
  );
};
