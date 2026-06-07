import {
  checkAuthStatus,
  clearAuthCookies,
  clearUrlParams,
  getUserIdFromCookies,
  getUsernameFromCookies,
  parseAuthUrlParams,
} from "src/services/auth.service";

export const setupDefaultAuthServiceMocks = () => {
  jest.mocked(getUserIdFromCookies).mockReturnValue(null);
  jest.mocked(getUsernameFromCookies).mockReturnValue(null);
  jest.mocked(checkAuthStatus).mockResolvedValue({
    isAuthenticated: false,
    username: null,
    userId: null,
  });
  jest.mocked(parseAuthUrlParams).mockReturnValue({
    authStatus: null,
    errorStatus: null,
  });
  jest.mocked(clearAuthCookies).mockImplementation(() => {});
  jest.mocked(clearUrlParams).mockImplementation(() => {});
};

export const setupAuthenticatedAuthServiceMocks = ({
  userId = "123",
  username = "testuser",
}: {
  userId?: string;
  username?: string;
} = {}) => {
  jest.mocked(getUserIdFromCookies).mockReturnValue(userId);
  jest.mocked(getUsernameFromCookies).mockReturnValue(username);
  jest.mocked(checkAuthStatus).mockResolvedValue({
    isAuthenticated: true,
    username,
    userId,
  });
  jest.mocked(parseAuthUrlParams).mockReturnValue({
    authStatus: null,
    errorStatus: null,
  });
  jest.mocked(clearAuthCookies).mockImplementation(() => {});
  jest.mocked(clearUrlParams).mockImplementation(() => {});
};
