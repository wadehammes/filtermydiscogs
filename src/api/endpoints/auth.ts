import { FetchMethods, fetchOptions, fetchResponse } from "src/api/helpers";

export const checkAuth = async (): Promise<{
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  reconnectUsername: string | null;
  rateLimited?: boolean;
  showSupportProjectToast?: boolean;
}> => {
  try {
    return fetchResponse(
      fetch("/api/auth/check", fetchOptions({ method: FetchMethods.Get })),
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to check auth status");
  }
};

export const clearData = async (): Promise<{ success: boolean }> => {
  try {
    return fetchResponse(
      fetch(
        "/api/auth/clear-data",
        fetchOptions({ method: FetchMethods.Post }),
      ),
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to clear data");
  }
};

export type LogoutOptions = {
  preserveTokens?: boolean;
};

export const logout = async ({
  preserveTokens = true,
}: LogoutOptions = {}): Promise<{ success: boolean }> => {
  try {
    const query = preserveTokens ? "" : "?preserve_tokens=false";
    return fetchResponse(
      fetch(
        `/api/auth/logout${query}`,
        fetchOptions({ method: FetchMethods.Post }),
      ),
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to logout");
  }
};
