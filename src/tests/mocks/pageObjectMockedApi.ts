import { api } from "src/api/urls";
import {
  checkAuthStatus,
  getUsernameFromCookies,
  parseAuthUrlParams,
} from "src/services/auth.service";

export const pageObjectMockApi = jest.mocked(api);
export const pageObjectMockCheckAuthStatus = jest.mocked(checkAuthStatus);
export const pageObjectMockGetUsernameFromCookies = jest.mocked(
  getUsernameFromCookies,
);
export const pageObjectMockParseAuthUrlParams = jest.mocked(parseAuthUrlParams);
export const pageObjectApiError = new Error("API request failed");
