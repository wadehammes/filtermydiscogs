const patchedFetchFlag = Symbol("fetchRelativeUrlPatched");

type FetchFn = typeof fetch & { [patchedFetchFlag]?: boolean };

export function patchFetchForRelativeUrls(): void {
  const currentFetch = globalThis.fetch as FetchFn | undefined;
  if (!currentFetch || currentFetch[patchedFetchFlag]) {
    return;
  }

  const nativeFetch = currentFetch.bind(globalThis);

  function fetchBaseUrl(): string {
    const href = globalThis.location?.href;
    if (typeof href === "string" && href.length > 0 && href !== "about:blank") {
      return href;
    }
    return "http://localhost/";
  }

  function resolveFetchUrl(input: RequestInfo | URL): RequestInfo | URL {
    if (typeof input === "string" && input.startsWith("/")) {
      return new URL(input, fetchBaseUrl()).href;
    }
    return input;
  }

  const patchedFetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    nativeFetch(resolveFetchUrl(input), init)) as FetchFn;

  patchedFetch[patchedFetchFlag] = true;
  globalThis.fetch = patchedFetch;
}

patchFetchForRelativeUrls();
