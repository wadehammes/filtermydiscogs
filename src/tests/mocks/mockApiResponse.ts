interface MockableEndpoint<TResolved, TRejected> {
  mockResolvedValue(value: TResolved): unknown;
  mockResolvedValueOnce(value: TResolved): unknown;
  mockRejectedValue(value: TRejected): unknown;
  mockRejectedValueOnce(value: TRejected): unknown;
}

interface PendingMockableEndpoint<TResolved> {
  mockImplementation(fn: () => Promise<TResolved>): unknown;
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

export const mockPendingApiResponse = <TResolved>(
  mockApiEndpoint: PendingMockableEndpoint<TResolved>,
): ((value: TResolved) => void) => {
  let resolve!: (value: TResolved) => void;

  mockApiEndpoint.mockImplementation(
    () =>
      new Promise<TResolved>((res) => {
        resolve = res;
      }),
  );

  return (value: TResolved) => {
    resolve(value);
  };
};
