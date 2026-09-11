const DEFAULT_DISCOGS_FETCH_TIMEOUT_MS = 20_000;

const discogsFetchTimeoutMs = (() => {
  const parsed = Number.parseInt(
    process.env.DISCOGS_FETCH_TIMEOUT_MS ||
      String(DEFAULT_DISCOGS_FETCH_TIMEOUT_MS),
    10,
  );

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_DISCOGS_FETCH_TIMEOUT_MS;
})();

export function discogsFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(discogsFetchTimeoutMs),
  });
}
