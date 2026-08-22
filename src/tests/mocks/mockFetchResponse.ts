export interface MockFetchResponseOptions {
  ok?: boolean;
  status?: number;
  statusText?: string;
}

export const mockFetchResponse = <T>(
  body?: T,
  options: MockFetchResponseOptions = {},
): Response => {
  const ok = options.ok ?? true;
  const status = options.status ?? (ok ? 200 : 500);

  return {
    ok,
    status,
    statusText: options.statusText ?? (ok ? "OK" : "Error"),
    headers: new Headers(),
    json: async () => body,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  } as Response;
};

export const mockFetchSuccess = <T>(
  body: T,
  options: Omit<MockFetchResponseOptions, "ok"> = {},
): Response => mockFetchResponse(body, { ok: true, status: 200, ...options });

export const mockFetchError = (
  status: number,
  body: Record<string, unknown> = {},
): Response => mockFetchResponse(body, { ok: false, status });

export const resetFetchMock = () => {
  if (jest.isMockFunction(fetch)) {
    jest.mocked(fetch).mockClear();
  }
};
