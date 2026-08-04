import { beforeEach, describe, expect, it } from "@jest/globals";
import { useRouter } from "next/navigation";
import { clearData, logout } from "src/api/helpers";
import { THEME_STORAGE_KEY } from "src/constants/storageKeys";
import { useClearAllUserData } from "src/hooks/useClearAllUserData.hook";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { act, renderHookWithTestProviders, waitFor } from "test-utils";

jest.mock("src/api/helpers", () => ({
  clearData: jest.fn(),
  logout: jest.fn(),
}));

const mockClearData = jest.mocked(clearData);
const mockLogout = jest.mocked(logout);
const mockUseRouter = jest.mocked(useRouter);

describe("useClearAllUserData", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockClearData.mockResolvedValue({ success: true });
    mockLogout.mockResolvedValue({ success: true });
  });

  it("clears server data, local storage, and redirects home", async () => {
    const mockReplace = jest.fn();
    mockUseRouter.mockReturnValue(
      createMockAppRouter({ replace: mockReplace }),
    );

    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    const { result } = renderHookWithTestProviders(
      () => useClearAllUserData(),
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    await act(async () => {
      await result.current.clearAllUserData();
    });

    await waitFor(() => {
      expect(mockClearData).toHaveBeenCalled();
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("resets isClearing when clearData fails", async () => {
    mockClearData.mockRejectedValue(new Error("Server error"));

    const { result } = renderHookWithTestProviders(
      () => useClearAllUserData(),
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    await expect(
      act(async () => {
        await result.current.clearAllUserData();
      }),
    ).rejects.toThrow("Server error");

    expect(result.current.isClearing).toBe(false);
    expect(mockLogout).not.toHaveBeenCalled();
  });
});
