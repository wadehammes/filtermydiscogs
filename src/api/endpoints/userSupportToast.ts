import { FetchMethods, fetchOptions, fetchResponse } from "src/api/helpers";

export const dismissSupportProjectToast = async (): Promise<{
  success: boolean;
}> => {
  try {
    return fetchResponse(
      fetch(
        "/api/user/support-toast/dismiss",
        fetchOptions({ method: FetchMethods.Post }),
      ),
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to dismiss support toast");
  }
};
