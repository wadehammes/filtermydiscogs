interface MockableEndpoint<TResolved, TRejected> {
  mockResolvedValue(value: TResolved): unknown;
  mockResolvedValueOnce(value: TResolved): unknown;
  mockRejectedValue(value: TRejected): unknown;
  mockRejectedValueOnce(value: TRejected): unknown;
}

export const mockApiResponse = <TResolved, TRejected = unknown>(
  responseResult: boolean | boolean[],
  mockApiEndpoint: MockableEndpoint<TResolved, TRejected>,
  resolvedResponse: TResolved,
  rejectedResponse: TRejected,
) => {
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
      mockApiEndpoint.mockRejectedValue(rejectedResponse);
    } else {
      mockApiEndpoint.mockRejectedValueOnce(rejectedResponse);
    }
  });
};
