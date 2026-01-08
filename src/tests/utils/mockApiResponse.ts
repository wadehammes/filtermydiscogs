import type { MockedFunction } from "jest-mock";

/**
 * Helper function to mock API responses in tests
 * This allows us to mock API functions instead of React Query hooks directly
 *
 * @param responseResult - Boolean or array of booleans indicating success (true) or failure (false)
 * @param mockApiEndpoint - The mocked API function
 * @param resolvedResponse - The response to return on success
 * @param rejectedResponse - The error to throw on failure (defaults to generic Error)
 */
export function mockApiResponse<T extends (...args: unknown[]) => unknown>(
  responseResult: boolean | boolean[],
  mockApiEndpoint: MockedFunction<T>,
  // biome-ignore lint/suspicious/noExplicitAny: Needed for mocks
  resolvedResponse: Awaited<any>,
  rejectedResponse: Error = new Error("API request failed"),
): void {
  const responseResults =
    typeof responseResult === "boolean" ? [responseResult] : responseResult;

  responseResults.forEach((result, index) => {
    const isLast = index === responseResults.length - 1;

    if (result) {
      if (isLast) {
        mockApiEndpoint.mockResolvedValue(resolvedResponse);
      } else {
        mockApiEndpoint.mockResolvedValueOnce(resolvedResponse);
      }
    } else if (isLast) {
      // @ts-expect-error - Jest mock types are strict, but Error is valid for rejection
      mockApiEndpoint.mockRejectedValue(rejectedResponse);
    } else {
      // @ts-expect-error - Jest mock types are strict, but Error is valid for rejection
      mockApiEndpoint.mockRejectedValueOnce(rejectedResponse);
    }
  });
}
