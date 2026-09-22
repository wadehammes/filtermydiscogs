import {
  HttpResponse,
  type HttpResponseResolver,
  http,
  type JsonBodyType,
  type PathParams,
} from "msw";
import { mswServer } from "src/tests/msw/server";
import { getLastCapturedFetchRequest } from "src/tests/msw/setupMswInJest";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type FetchInitExpectation = {
  method?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  body?: string;
};

const httpByMethod = {
  get: http.get,
  post: http.post,
  put: http.put,
  patch: http.patch,
  delete: http.delete,
} as const;

function registerOnce(
  method: HttpMethod,
  path: string,
  resolver: HttpResponseResolver<PathParams>,
) {
  mswServer.use(httpByMethod[method](path, resolver, { once: true }));
}

export function jsonRoundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function mockFetchJsonOnce(
  method: HttpMethod,
  path: string,
  body: JsonBodyType,
  status = 200,
) {
  registerOnce(method, path, () => HttpResponse.json(body, { status }));
}

export function mockFetchErrorOnce(
  method: HttpMethod,
  path: string,
  status: number,
  body: Record<string, unknown> = {},
) {
  registerOnce(method, path, () => HttpResponse.json(body, { status }));
}

export function mockFetchEmptyOnce(method: HttpMethod, path: string) {
  registerOnce(method, path, () => new HttpResponse(null, { status: 200 }));
}

export function mockFetchNetworkErrorOnce(method: HttpMethod, path: string) {
  registerOnce(method, path, () => {
    throw new TypeError("Failed to fetch");
  });
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export function expectLastFetchCalledWith(
  expectedUrl: string | RegExp,
  expectedInit: FetchInitExpectation = {},
) {
  const request = getLastCapturedFetchRequest();
  if (!request) {
    throw new Error("Expected a captured fetch request");
  }

  const normalized = normalizeUrl(request.url);

  if (typeof expectedUrl === "string") {
    expect(normalized).toBe(expectedUrl);
  } else {
    expect(normalized).toMatch(expectedUrl);
  }

  if (expectedInit.method !== undefined) {
    expect(request.method).toBe(expectedInit.method);
  }

  if (
    expectedInit.credentials !== undefined &&
    request.credentials !== undefined
  ) {
    expect(request.credentials).toBe(expectedInit.credentials);
  }

  if (expectedInit.cache !== undefined && request.cache !== undefined) {
    expect(request.cache).toBe(expectedInit.cache);
  }

  if (expectedInit.headers !== undefined) {
    for (const [key, value] of Object.entries(expectedInit.headers)) {
      expect(request.headers.get(key)).toBe(value);
    }
  }
}

export async function expectLastFetchCalledWithBody(
  expectedUrl: string | RegExp,
  expectedInit: FetchInitExpectation,
) {
  expectLastFetchCalledWith(expectedUrl, expectedInit);
  if (expectedInit.body === undefined) {
    return;
  }
  const request = getLastCapturedFetchRequest();
  if (!request) {
    throw new Error("Expected a captured fetch request");
  }
  await expect(request.text()).resolves.toBe(expectedInit.body);
}

export function getLastFetchUrl(): string {
  const request = getLastCapturedFetchRequest();
  if (!request) {
    throw new Error("Expected a captured fetch request");
  }
  return normalizeUrl(request.url);
}
